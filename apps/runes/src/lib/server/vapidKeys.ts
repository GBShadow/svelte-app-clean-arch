import { VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '$env/static/private';
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';

export const vapidKeys = {
	publicKey: PUBLIC_VAPID_PUBLIC_KEY,
	privateKey: VAPID_PRIVATE_KEY,
	subject: VAPID_SUBJECT
};
