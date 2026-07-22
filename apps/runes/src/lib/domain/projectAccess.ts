import type { ProjectRecord, SprintRecord } from '$lib/server/projectRecord';

export function isProjectAdmin(userId: string | undefined, project: { responsaveis: string[]; created_by: string }): boolean {
	if (!userId) return false;
	return project.created_by === userId || project.responsaveis.includes(userId);
}

export function isProjectParticipant(userId: string | undefined, project: { participants: string[] }): boolean {
	if (!userId) return false;
	return project.participants.includes(userId);
}

export function canViewProject(user: { id: string; isAdmin: boolean } | null | undefined, project: { participants: string[] }): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return project.participants.includes(user.id);
}

export function canManageProject(user: { id: string; isAdmin: boolean } | null | undefined, project: { created_by: string; responsaveis: string[] }): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return project.created_by === user.id || project.responsaveis.includes(user.id);
}

export function canManageParticipants(user: { id: string; isAdmin: boolean } | null | undefined, project: { created_by: string; responsaveis: string[] }): boolean {
	return canManageProject(user, project);
}

export function canDeleteProject(user: { id: string; isAdmin: boolean } | null | undefined, project: { created_by: string }): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return project.created_by === user.id;
}

export function canCreateProject(user: { isAdmin: boolean } | null | undefined): boolean {
	return !!user?.isAdmin;
}

export function canCreateSprint(user: { id: string; isAdmin: boolean } | null | undefined, project: { created_by: string; responsaveis: string[] }): boolean {
	return canManageProject(user, project);
}

export function canStartSprint(user: { id: string; isAdmin: boolean } | null | undefined, project: { created_by: string; responsaveis: string[] }): boolean {
	return canManageProject(user, project);
}

export function canFinalizeSprint(user: { id: string; isAdmin: boolean } | null | undefined, project: { created_by: string; responsaveis: string[] }): boolean {
	return canManageProject(user, project);
}

export function getTargetSprint(
	projectId: string,
	sprints: SprintRecord[]
): { sprint: SprintRecord; targetStatus: 'active' | 'planned' } | null {
	const active = sprints.find((s) => s.project === projectId && s.status === 'active');
	if (active) return { sprint: active, targetStatus: 'active' };

	const planned = sprints.find((s) => s.project === projectId && s.status === 'planned');
	if (planned) return { sprint: planned, targetStatus: 'planned' };

	return null;
}

export function getActiveSprint(projectId: string, sprints: SprintRecord[]): SprintRecord | null {
	return sprints.find((s) => s.project === projectId && s.status === 'active') ?? null;
}
