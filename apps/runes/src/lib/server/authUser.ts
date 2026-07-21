export type AuthenticatedUser = {
	id: string;
	authId: string;
	name: string;
	email: string;
	jobTitle: string;
	isAdmin: boolean;
	mustChangePassword: boolean;
	passwordSetAt: string | null;
	avatar: string;
};
