export type AuthenticatedUser = {
	id: string;
	name: string;
	email: string;
	jobTitle: string;
	isAdmin: boolean;
	mustChangePassword: boolean;
	passwordSetAt: string | null;
	avatar: string;
};
