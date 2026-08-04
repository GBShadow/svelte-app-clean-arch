/**
 * svelte-app-session-changes — plugin opencode para o svelte-app.
 *
 * Portado do dtp-ai (session-changes.ts), adaptado aos caminhos do svelte-app:
 *
 * 1. Após Edit/Write em apps/|packages/ -> append em .opencode/.session-changes.log
 *    (consumido pelo /checkpoint e pelo docs-writer, que trunca o arquivo)
 * 2. Após Edit/Write em docs/sessions/*.md -> alerta se passar de 800 linhas
 *    (checkpoint NÃO é diário append-only)
 * 3. Após Edit/Write em pocketbase/pb_migrations/ -> alerta se o stamp do
 *    /audit-sync estiver velho (>24h) ou ausente
 */
import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, appendFileSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const EDIT_TOOLS = new Set(["edit", "write", "multi_edit", "patch"])
const SENSITIVE_RE = /(^|\/)pocketbase[/\\]pb_migrations[/\\]/
const SESSION_RE = /docs[/\\]sessions[/\\].+\.md$/
const LOG_LINE_LIMIT = 800
const STAMP_MAX_AGE_H = 24

function getFilePath(args: any): string {
  return String(args?.file_path ?? args?.filePath ?? args?.path ?? "")
}

const plugin: Plugin = async ({ directory }) => {
  const repoRoot = directory

  function logPath(): string {
    return join(repoRoot, ".opencode", ".session-changes.log")
  }

  function stampPath(): string {
    return join(repoRoot, ".opencode", ".audit-sync-stamp")
  }

  return {
    "tool.execute.after": async (input, output) => {
      const tool = input.tool
      if (!EDIT_TOOLS.has(tool)) return
      const file = getFilePath(input.args)
      if (!file) return

      // 1. Log de mudanças em código (apps/ | packages/)
      if (/(^|\/)(apps|packages)\//.test(file)) {
        try {
          mkdirSync(join(repoRoot, ".opencode"), { recursive: true })
          appendFileSync(
            logPath(),
            `${new Date().toISOString()} ${tool} ${file}\n`,
          )
        } catch {
          // não bloquear a sessão por falha de log
        }
      }

      const warnings: string[] = []

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
          last = statSync(stampPath()).mtimeMs
        } catch {
          last = 0
        }
        const ageH = (Date.now() - last) / 3_600_000
        if (ageH > STAMP_MAX_AGE_H) {
          warnings.push(
            `Área sensível (${file.replace(/^.*\/pocketbase\//, "pocketbase/")}) e /audit-sync não roda há ` +
              `${last ? `${ageH.toFixed(1)}h` : "NUNCA"}. Rode /audit-sync antes de prosseguir, ` +
              `ou \`touch ${stampPath()}\` para suprimir.`,
          )
        }
      }

      if (warnings.length > 0) {
        output.title += ` | ⚠️  ${warnings.join(" · ")}`
      }
    },
  }
}

export default plugin
