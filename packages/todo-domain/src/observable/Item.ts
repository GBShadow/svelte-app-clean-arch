import { createId } from "../types";
import type { TodoItemDTO } from "../types";

export default class Item {
  id: string;
  description: string;
  done: boolean;

  constructor(id: string | null, description: string, done = false) {
    this.id = id ?? createId();
    this.description = description;
    this.done = done;
  }

  toDTO(): TodoItemDTO {
    return {
      id: this.id,
      description: this.description,
      done: this.done,
    };
  }
}
