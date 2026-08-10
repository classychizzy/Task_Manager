import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CommentDTO } from '../../dto/comment_dto';
import { sqlInjectionPayloads, xssPayloads } from '../helpers/securitypayload';

describe('CommentDTO validation', () => {
    const validateDto = async (payload: object) => {
        const dto = plainToInstance(CommentDTO, payload);
        return validate(dto);
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
        const dto = plainToInstance(CommentDTO, { content: '   trimmed comment   ' });
        const errors = await validate(dto);
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

        it.each(sqlInjectionPayloads)('accepts SQL-injection-shaped content as valid comment text: %s', async (payload) => {
            const errors = await validateDto({ content: `Note: ${payload}` });
            expect(errors.length).toBe(0);
        });

        it.each(xssPayloads)('accepts XSS-shaped content as valid comment text: %s', async (payload) => {
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