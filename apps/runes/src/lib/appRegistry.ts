import ListChecks from 'lucide-svelte/icons/list-checks';
import MessageCircle from 'lucide-svelte/icons/message-circle';
import Users from 'lucide-svelte/icons/users';
import Kanban from 'lucide-svelte/icons/kanban';
import Dices from 'lucide-svelte/icons/dices';
import FolderKanban from 'lucide-svelte/icons/folder-kanban';

export interface AppEntry {
	id: string;
	name: string;
	description: string;
	icon: any;
	route: string;
	adminOnly?: boolean;
}

export const appRegistry: AppEntry[] = [
	{
		id: 'todos',
		name: 'Tarefas',
		description: 'Gerencie suas listas de tarefas do dia a dia',
		icon: ListChecks,
		route: '/todos'
	},
	{
		id: 'kanban',
		name: 'Kanban',
		description: 'Quadro de cartões para acompanhar o fluxo de tarefas',
		icon: Kanban,
		route: '/kanban'
	},
	{
		id: 'poker',
		name: 'Planning Poker',
		description: 'Estime o esforço de tarefas de forma colaborativa',
		icon: Dices,
		route: '/poker'
	},
	{
		id: 'chat',
		name: 'Chat',
		description: 'Converse em tempo real com outros usuários',
		icon: MessageCircle,
		route: '/chat'
	},
	{
		id: 'users',
		name: 'Usuários',
		description: 'Gerencie os usuários do sistema',
		icon: Users,
		route: '/users',
		adminOnly: true
	},
	{
		id: 'projects',
		name: 'Projetos',
		description: 'Gerencie projetos, sprints e participantes',
		icon: FolderKanban,
		route: '/projects'
	}
];
