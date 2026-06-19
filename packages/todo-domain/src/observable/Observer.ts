export default class Observer {
	constructor(
		readonly event: string,
		readonly callback: (data: unknown) => void | Promise<void>
	) {}
}
