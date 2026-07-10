export type TodoListAccessInfo = {
	ownerId: string;
	public: boolean;
};

export function canView(list: TodoListAccessInfo, userId: string): boolean {
	return list.ownerId === userId || list.public;
}

export function canWrite(list: TodoListAccessInfo, userId: string): boolean {
	return list.ownerId === userId;
}
