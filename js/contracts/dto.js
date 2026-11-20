// @ts-check
/**
 * DTO: copia en JSDoc de docs/api/contrato-v1.md. No se cambia sin una versión nueva del contrato.
 * Solo los usan js/contracts/mappers.js y js/api/. La UI nunca los usa.
 */

/** @typedef {'EXPENSE' | 'INCOME'} TransactionTypeDTO */

/** @typedef {'FOOD' | 'TRANSPORT' | 'HOUSING' | 'UTILITIES' | 'LEISURE' | 'OTHER'} ExpenseCategoryDTO */

/** @typedef {'WORK' | 'OTHER_INCOME'} IncomeCategoryDTO */

/** @typedef {ExpenseCategoryDTO | IncomeCategoryDTO} CategoryDTO */

/**
 * @typedef {Object} TransactionDTO
 * @property {string} id
 * @property {TransactionTypeDTO} type
 * @property {CategoryDTO} category
 * @property {number} amount  céntimos enteros, de 1 a 1 000 000
 * @property {string} date  YYYY-MM-DD
 * @property {string} description  de 1 a 60 caracteres
 * @property {string} created_at  ISO 8601 con -05:00
 * @property {string} updated_at  ISO 8601 con -05:00
 * @property {string | null} deleted_at  eliminación lógica
 */

/**
 * Cuerpo de POST /transactions.
 * @typedef {Object} TransactionCreateDTO
 * @property {TransactionTypeDTO} type
 * @property {CategoryDTO} category
 * @property {number} amount
 * @property {string} date
 * @property {string} description
 */

/**
 * Cuerpo de PATCH /transactions/{id}: solo los campos que cambian.
 * @typedef {Partial<TransactionCreateDTO>} TransactionPatchDTO
 */

/**
 * @typedef {Object} BudgetDTO
 * @property {ExpenseCategoryDTO} category
 * @property {number} limit  céntimos enteros, de 1 a 1 000 000
 * @property {string} effective_from  YYYY-MM
 * @property {string} created_at
 * @property {string} updated_at
 */

/** @typedef {'VALIDATION_ERROR' | 'NOT_FOUND' | 'OUTSIDE_CURRENT_MONTH' | 'SERVER_ERROR'} ErrorCodeDTO */

/**
 * @typedef {Object} ErrorDTO
 * @property {{ code: ErrorCodeDTO, message: string, fields?: Record<string, string> }} error
 */

export {};
