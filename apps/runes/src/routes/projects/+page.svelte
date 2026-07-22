<script lang="ts">
	import type { PageProps } from './$types';
	import { canCreateProject } from '$lib/domain/projectAccess';
	import FolderKanban from 'lucide-svelte/icons/folder-kanban';
	import Plus from 'lucide-svelte/icons/plus';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import User from 'lucide-svelte/icons/user';
	import Shield from 'lucide-svelte/icons/shield';
	import ImageIcon from 'lucide-svelte/icons/image';
	import type { ProjectRecord } from '$lib/server/projectRecord';

	let { data }: PageProps = $props();

	const projects = $derived(data.projects as ProjectRecord[]);
	const user = $derived(data.user as any);
</script>

<div class="mx-auto w-full max-w-5xl p-4">
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
		<div>
			<h1 class="text-3xl font-black tracking-tight text-primary flex items-center gap-3">
				<FolderKanban class="w-8 h-8" />
				Projetos
			</h1>
			<p class="text-base-content/60 text-sm mt-1">
				Gerencie seus projetos e sprints
			</p>
		</div>
		{#if canCreateProject(user)}
			<a href="/projects/new" class="btn btn-primary" data-testid="btn-new-project">
				<Plus class="w-4 h-4" />
				Novo Projeto
			</a>
		{/if}
	</div>

	{#if projects.length === 0}
		<div class="flex flex-col items-center justify-center py-16 px-4 bg-base-200 border border-base-300 rounded-2xl text-center">
			<FolderKanban class="w-16 h-16 text-base-content/20 mb-4" />
			<h2 class="text-lg font-bold text-base-content/80">Nenhum projeto</h2>
			<p class="text-sm text-base-content/50 max-w-sm mt-1">
				Você não participa de nenhum projeto no momento.
			</p>
			{#if canCreateProject(user)}
				<a href="/projects/new" class="btn btn-primary btn-sm mt-6">
					Criar primeiro projeto
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each projects as project (project.id)}
				<a
					href="/projects/{project.id}"
					class="card bg-base-200 border border-base-300 hover:border-primary/50 transition-colors group"
				>
					<div class="card-body p-5 flex flex-col justify-between h-full">
						<div>
							<div class="flex items-start gap-3 mb-3">
								{#if project.image}
									<div class="avatar">
										<div class="w-12 h-12 rounded-xl">
											<img src="/api/files/projects/{project.id}/{project.image}" alt={project.title} class="object-cover" />
										</div>
									</div>
								{:else}
									<div class="w-12 h-12 rounded-xl bg-base-300 flex items-center justify-center">
										<FolderKanban class="w-6 h-6 opacity-50" />
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<h3 class="card-title text-base font-bold truncate">
										{project.title}
									</h3>
									<p class="text-xs text-base-content/60 line-clamp-2 mt-1">
										{project.description}
									</p>
								</div>
							</div>
						</div>

						<div class="flex items-center justify-between mt-4 pt-3 border-t border-base-300">
							<div class="flex items-center gap-3 text-xs text-base-content/50">
								<span class="flex items-center gap-1">
									<User class="w-3.5 h-3.5" />
									{project.expand?.participants?.length || 0}
								</span>
								{#if project.expand?.responsaveis?.some((r) => r.id === user?.id)}
									<span class="flex items-center gap-1 text-primary">
										<Shield class="w-3.5 h-3.5" />
										Responsável
									</span>
								{/if}
							</div>
							<ArrowRight class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
