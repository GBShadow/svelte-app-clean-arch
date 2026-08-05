/**
 * svelte-app-session-changes — hook OMP para o svelte-app.
 *
 * Porta o plugin opencode `.opencode/plugin/session-changes.ts` para a API de
 * hooks do OMP (pi.on("tool_result")), self-contained em `.omp/`:
 *
 * 1. Após Edit/Write em apps/|packages/ -> append em .omp/.session-changes.log
 *    (consumido pelo /checkpoint e pelo docs-writer, que trunca o arquivo)
 * 2. Após Edit/Write em docs/sessions/*.md -> alerta se passar de 800 linhas
 *    (checkpoint NÃO é diário append-only)
 * 3. Após Edit/Write em pocketbase/pb_migrations/ -> alerta se o stamp do
 *    /audit-sync estiver velho (>24h) ou ausente
 */
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks"
import { appendFileSync, mkdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const EDIT_TOOLS = new Set(["edit", "write", "multi_edit", "patch", "ast_edit"])
const SENSITIVE_RE = /(^|\/)pocketbase[/\\]pb_migrations[/\\]/
const SESSION_RE = /docs[/\\]sessions[/\\].+\.md$/
const LOG_LINE_LIMIT = 800
const STAMP_MAX_AGE_H = 24
const INTERNAL_URI_RE = /^(xd|skill|memory|agent|omp|history|artifact|local|issue|pr):\/\//

function extractPaths(input: unknown): string[] {
  if (!input || typeof input !== "object") return []
  const args = input as Record<string, unknown>
  const candidates: string[] = []

  for (const key of ["path", "file_path", "filePath", "paths"]) {
    const v = args[key]
    if (typeof v === "string" && v) candidates.push(v)
    if (Array.isArray(v)) candidates.push(...v.filter((x): x is string => typeof x === "string"))
  }

  // Parse [path#TAG] headers embedded in string args (edit input style)
  for (const v of Object.values(args)) {
    if (typeof v !== "string") continue
    const m = v.match(/\[([^\]#]+)#[0-9A-Fa-f]{4}\]/)
    if (m) candidates.push(m[1])
  }

  return [...new Set(candidates)].filter((p) => !INTERNAL_URI_RE.test(p))
}

export default function sessionChanges(pi: HookAPI): void {
  pi.on("tool_result", async (event, ctx) => {
    if (event.isError || !EDIT_TOOLS.has(event.toolName)) return

    const repoRoot = ctx?.cwd ?? process.cwd()
    const logPath = join(repoRoot, ".omp", ".session-changes.log")
    const stampPath = join(repoRoot, ".omp", ".audit-sync-stamp")
    const warnings: string[] = []

    for (const file of extractPaths(event.input)) {
      // 1. Log de mudanças em código (apps/ | packages/)
      if (/(^|\/)(apps|packages)\//.test(file)) {
        try {
          mkdirSync(join(repoRoot, ".omp"), { recursive: true })
          appendFileSync(logPath, `${new Date().toISOString()} ${event.toolName} ${file}\n`)
        } catch {
          // não bloquear a sessão por falha de log
        }
      }

      // 2. Alerta de checkpoint inchado (docs/sessions/*.md)
      if (SESSION_RE.test(file)) {
        try {
          const lines = readFileSync(join(repoRoot, file), "utf8").split("\n").length
          if (lines > LOG_LINE_LIMIT) {
            warnings.push(
              `${file} tem ${lines} linhas (>${LOG_LINE_LIMIT}). ` +
                `Checkpoint NÃO é diário append-only — reescreva "O que foi feito" e "Próximos passos". Considere /checkpoint.`,
            )
          }
        } catch {
          // arquivo pode não existir ainda
        }
      }

      // 3. Alerta de área sensível (pb_migrations) sem /audit-sync recente
      if (SENSITIVE_RE.test(file)) {
        let last = 0
        try {
          last = statSync(stampPath).mtimeMs
        } catch {
          last = 0
        }
        const ageH = (Date.now() - last) / 3_600_000
        if (ageH > STAMP_MAX_AGE_H) {
          warnings.push(
            `Área sensível (${file.replace(/^.*\/pocketbase\//, "pocketbase/")}) e /audit-sync não roda há ` +
              `${last ? `${ageH.toFixed(1)}h` : "NUNCA"}. Rode /audit-sync antes de prosseguir, ` +
              `ou \`touch ${stampPath}\` para suprimir.`,
          )
        }
      }
    }

    if (warnings.length > 0) {
      const content = Array.isArray(event.content) ? event.content : []
      return {
        content: [
          ...content,
          { type: "text", text: `⚠️ ${warnings.join(" · ")}` },
        ],
      }
    }
  })
}
