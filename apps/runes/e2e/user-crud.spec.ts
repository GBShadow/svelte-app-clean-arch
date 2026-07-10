import { test, expect } from './fixtures';

test.describe('Admin User CRUD (runes e2e)', () => {
	const uniqueId = Date.now().toString(36);
	const newUser = {
		name: `Teste ${uniqueId}`,
		email: `teste-${uniqueId}@example.com`,
		jobTitle: 'senior' as const,
		password: 'senha123456'
	};

	test('admin cria um novo usuário, edita, reseta senha e exclui', async ({ page }) => {
		// --- Criar usuário ---
		await page.goto('/users/new');
		await expect(page.getByRole('heading', { name: /Novo usuário/i })).toBeVisible();

		await page.getByLabel('Nome').fill(newUser.name);
		await page.getByLabel('E-mail').fill(newUser.email);
		await page.getByLabel('Cargo').selectOption(newUser.jobTitle);
		await page.getByLabel('Senha').fill(newUser.password);
		await page.getByLabel('Confirmar senha').fill(newUser.password);
		await page.getByRole('button', { name: 'Criar' }).click();
		await page.waitForURL('/users');

		// --- Verificar que o usuário aparece na lista ---
		await expect(page.getByRole('cell', { name: newUser.name })).toBeVisible();
		await expect(page.getByRole('cell', { name: newUser.email })).toBeVisible();
		await expect(page.getByRole('cell', { name: /Senior/i })).toBeVisible();

		// --- Editar usuário (usar filtro pela linha do novo email) ---
		const userRow = page.getByRole('row').filter({ hasText: newUser.email });
		await userRow.getByRole('link', { name: 'Editar' }).click();
		await page.waitForURL(/\/users\/.+\/edit/);
		await expect(page.getByRole('heading', { name: /Editar usuário/i })).toBeVisible();

		const newName = `Editado ${uniqueId}`;
		await page.getByLabel('Nome').fill(newName);
		await page.getByRole('button', { name: 'Salvar' }).click();
		await page.waitForURL(/\/users/);
		await expect(page.getByRole('cell', { name: newName })).toBeVisible();

		// --- Resetar senha ---
		const updatedRow = page.getByRole('row').filter({ hasText: newName });
		await updatedRow.getByRole('link', { name: 'Editar' }).click();
		await page.waitForURL(/\/users\/.+\/edit/);

		await page.getByLabel('Nova senha').fill('nova-senha-9876');
		await page.getByLabel('Confirmar nova senha').fill('nova-senha-9876');
		await page.getByRole('button', { name: 'Resetar senha' }).click();

		await expect(page.getByText(/Senha resetada/i)).toBeVisible();

		// --- Excluir usuário ---
		await page.getByRole('button', { name: 'Excluir' }).click();
		await page.waitForURL('/users');
		await expect(page.getByRole('cell', { name: newName })).not.toBeVisible();
	});

	test('mostra validação ao criar usuário com dados inválidos', async ({ page }) => {
		await page.goto('/users/new');

		// Remove required attribute para permitir submit sem preencher
		await page.evaluate(() => {
			document.querySelectorAll('input[required]').forEach((el) => el.removeAttribute('required'));
		});

		await page.getByRole('button', { name: 'Criar' }).click();

		await expect(page.getByText(/Nome obrigatório/i)).toBeVisible();
	});
});
