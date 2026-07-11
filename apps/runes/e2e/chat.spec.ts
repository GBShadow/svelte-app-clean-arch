import { test, expect } from './fixtures';
import { cleanupChatRoom, cleanupUser } from './cleanup';

test.describe('Chat (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const roomName = `Sala ${uniqueId}`;
	const participantEmail = `chat-partner-${uniqueId}@example.com`;

	test('cria sala com participante, envia mensagem, sai da sala', async ({ page }) => {
		try {
			// --- Criar um segundo usuário para participar da sala ---
			await page.goto('/users/new');
			await page.getByTestId('input-name').fill('Parceiro Chat');
			await page.getByTestId('input-email').fill(participantEmail);
			await page.getByTestId('select-job-title').selectOption('senior');
			await page.getByTestId('input-password').fill('senha123456');
			await page.getByTestId('input-confirm-password').fill('senha123456');
			await page.getByTestId('btn-create-user').click();
			await page.waitForURL('/users');

			// --- Criar sala escolhendo o novo usuário como participante ---
			await page.goto('/chat/new');
			await page.getByTestId('input-room-name').fill(roomName);
			await page
				.locator('label', { hasText: participantEmail })
				.locator('input[type=checkbox]')
				.check();
			await page.getByTestId('btn-create-room').click();

			await expect(page.getByTestId('room-title')).toContainText(roomName);

			await page.getByTestId('input-message').fill('Mensagem de teste');
			await page.getByTestId('btn-send-message').click();
			await expect(page.getByTestId('chat-messages-card')).toContainText('Mensagem de teste');

			await page.getByTestId('btn-leave-room').click();
			await page.waitForURL('/chat');
		} finally {
			await cleanupChatRoom(page.request, roomName);
			await cleanupUser(page.request, participantEmail);
		}
	});

	test('validação de participantes vazios em nova sala', async ({ page }) => {
		await page.goto('/chat/new');
		await page.getByTestId('btn-create-room').click();
		await expect(page.getByTestId('error-participant-ids')).toBeVisible();
	});
});
