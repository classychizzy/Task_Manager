"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const comment_dto_1 = require("../../dto/comment_dto");
const securitypayload_1 = require("../helpers/securitypayload");
describe('CommentDTO validation', () => {
    const validateDto = async (payload) => {
        const dto = (0, class_transformer_1.plainToInstance)(comment_dto_1.CommentDTO, payload);
        return (0, class_validator_1.validate)(dto);
    };
    it('passes with a normal comment', async () => {
        const errors = await validateDto({ content: 'Looks good to me, ship it!' });
        expect(errors.length).toBe(0);
    });
    it('rejects an empty comment', async () => {
        const errors = await validateDto({ content: '' });
        expect(errors.length).toBeGreaterThan(0);
    });
    it('rejects a whitespace-only comment', async () => {
        const errors = await validateDto({ content: '     ' });
        expect(errors.length).toBeGreaterThan(0);
    });
    it('rejects a missing content field', async () => {
        const errors = await validateDto({});
        expect(errors.length).toBeGreaterThan(0);
    });
    it('trims leading/trailing whitespace before validating', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(comment_dto_1.CommentDTO, { content: '   trimmed comment   ' });
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
        expect(dto.content).toBe('trimmed comment');
    });
    it('accepts a very short but genuinely non-empty comment', async () => {
        const errors = await validateDto({ content: 'ok' });
        expect(errors.length).toBe(0);
    });
    it('accepts a single emoji as a comment', async () => {
        const errors = await validateDto({ content: '👍' });
        expect(errors.length).toBe(0);
    });
    it('accepts a comment at exactly the max length (2000 chars)', async () => {
        const errors = await validateDto({ content: 'a'.repeat(2000) });
        expect(errors.length).toBe(0);
    });
    it('rejects a comment exceeding the max length (2001 chars)', async () => {
        const errors = await validateDto({ content: 'a'.repeat(2001) });
        expect(errors.length).toBeGreaterThan(0);
    });
    describe('free-text design — dangerous-looking payloads are intentionally accepted', () => {
        // Comments are NOT character-whitelisted, unlike name/title/description
        // fields. Injection protection comes from parameterized queries at the
        // DB layer; XSS protection comes from output encoding at render time.
        // These tests document that decision — they should PASS (errors.length
        // === 0), confirming the DTO does not reject this content.
        it.each(securitypayload_1.sqlInjectionPayloads)('accepts SQL-injection-shaped content as valid comment text: %s', async (payload) => {
            const errors = await validateDto({ content: `Note: ${payload}` });
            expect(errors.length).toBe(0);
        });
        it.each(securitypayload_1.xssPayloads)('accepts XSS-shaped content as valid comment text: %s', async (payload) => {
            const errors = await validateDto({ content: `See also: ${payload}` });
            expect(errors.length).toBe(0);
        });
        it('accepts normal punctuation, numbers, and symbols freely', async () => {
            const errors = await validateDto({
                content: 'Cost is ~$500 (see invoice #123) — approved @ 90%! 🎉',
            });
            expect(errors.length).toBe(0);
        });
        it('accepts non-Latin scripts', async () => {
            const errors = await validateDto({ content: '这个任务已经完成了' });
            expect(errors.length).toBe(0);
        });
    });
});
