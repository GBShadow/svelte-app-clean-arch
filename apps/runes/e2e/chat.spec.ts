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

	test('preserva nome e avatar de remetente órfão após ser removido e nega acesso', async ({ page, browser }) => {
		const partnerEmailUnique = `chat-orphan-${uniqueId}@example.com`;
		const roomNameOrphan = `Sala Orfa ${uniqueId}`;

		try {
			// --- Criar um parceiro de chat ---
			await page.goto('/users/new');
			await page.getByTestId('input-name').fill('Parceiro Removido');
			await page.getByTestId('input-email').fill(partnerEmailUnique);
			await page.getByTestId('select-job-title').selectOption('developer');
			await page.getByTestId('input-password').fill('senha123456');
			await page.getByTestId('input-confirm-password').fill('senha123456');
			await page.getByTestId('btn-create-user').click();
			await page.waitForURL('/users');

			// --- Criar sala com o parceiro ---
			await page.goto('/chat/new');
			await page.getByTestId('input-room-name').fill(roomNameOrphan);
			await page
				.locator('label', { hasText: partnerEmailUnique })
				.locator('input[type=checkbox]')
				.check();
			await page.getByTestId('btn-create-room').click();

			// Aguarda redirecionamento para a sala
			await expect(page.getByTestId('room-title')).toContainText(roomNameOrphan);
			const roomId = page.url().split('/').pop();

			// --- Parceiro envia uma mensagem (simulado via API) ---
			const baseUrl = page.url().split('/chat/')[0];
			const tokenResponse = await page.request.post(`${baseUrl}/api/collections/auth/auth-with-password`, {
				data: { identity: partnerEmailUnique, password: 'senha123456' }
			});
			const authData = await tokenResponse.json();
			const partnerId = authData.record.id;
			const partnerToken = authData.token;

			// Postar a mensagem usando a autenticação do parceiro
			await page.request.post(`${baseUrl}/api/collections/chat_messages/records`, {
				headers: { Authorization: `Bearer ${partnerToken}` },
				data: {
					room: roomId,
					sender: partnerId,
					text: 'Mensagem historica do parceiro'
				}
			});

			// Admin envia uma mensagem para dar reload na UI/forçar visualização
			await page.getByTestId('input-message').fill('Resposta do admin');
			await page.getByTestId('btn-send-message').click();

			// Garante que a mensagem do parceiro está visível
			await expect(page.getByTestId('chat-messages-card')).toContainText('Mensagem historica do parceiro');
			await expect(page.getByTestId('chat-messages-card')).toContainText('Parceiro Removido');

			// --- Admin remove o parceiro da sala ---
			await page.getByTestId(`btn-remove-participant-${partnerId}`).click();

			// Após remoção, a mensagem dele deve continuar exibindo "Parceiro Removido"
			await expect(page.getByTestId('chat-messages-card')).toContainText('Mensagem historica do parceiro');
			await expect(page.getByTestId('chat-messages-card')).toContainText('Parceiro Removido');

			// --- Testar AC2: Parceiro removido tenta acessar e recebe 403 ---
			const partnerContext = await browser.newContext();
			const partnerPage = await partnerContext.newPage();
			await partnerPage.goto('/login');
			await partnerPage.getByTestId('input-email').fill(partnerEmailUnique);
			await partnerPage.getByTestId('input-password').fill('senha123456');
			await partnerPage.getByTestId('btn-login').click();
			await partnerPage.waitForURL('/');

			const response = await partnerPage.goto(`/chat/${roomId}`);
			expect(response?.status()).toBe(403);
			await partnerContext.close();

		} finally {
			await cleanupChatRoom(page.request, roomNameOrphan);
			await cleanupUser(page.request, partnerEmailUnique);
		}
	});
});
