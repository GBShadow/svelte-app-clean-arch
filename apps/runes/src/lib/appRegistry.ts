import { ListChecks, MessageCircle, Users } from 'lucide-svelte';

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
	}
];
