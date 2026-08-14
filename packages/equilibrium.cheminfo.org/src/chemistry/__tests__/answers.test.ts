import { expect, test } from 'vitest';

import { ANSWER_TOLERANCE, checkAnswer, parseAnswer } from '../answers.ts';

test('a decimal comma is read like a decimal point', () => {
  expect(parseAnswer('2,85')).toBe(2.85);
  expect(parseAnswer('2.85')).toBe(2.85);
  expect(parseAnswer('  2.85  ')).toBe(2.85);
  expect(parseAnswer('-0.3')).toBe(-0.3);
  expect(parseAnswer('.5')).toBe(0.5);
  expect(parseAnswer('1e-2')).toBe(0.01);
});

test('anything that is not a plain number is rejected', () => {
  expect(parseAnswer('2.85 or so')).toBeUndefined();
  expect(parseAnswer('about 3')).toBeUndefined();
  expect(parseAnswer('2,8,5')).toBeUndefined();
  expect(parseAnswer('')).toBeUndefined();
  expect(parseAnswer('NaN')).toBeUndefined();
});

test('an empty box is unanswered, not wrong', () => {
  expect(checkAnswer('', 2.85)).toStrictEqual({ status: 'unanswered' });
  expect(checkAnswer(' '.repeat(3), 2.85)).toStrictEqual({
    status: 'unanswered',
  });
});

test('unreadable input is reported instead of being graded', () => {
  const check = checkAnswer('two point eight', 2.85);

  expect(check.status).toBe('invalid');
  expect(check.value).toBeUndefined();
  expect(check.message).toBe(
    'That is not a number. Type the pH only, for example 2.85 — a comma works too.',
  );
});

test('the tolerance is 0.05 pH unit on either side', () => {
  expect(ANSWER_TOLERANCE).toBe(0.05);
  expect(checkAnswer('2.85', 2.85)).toStrictEqual({
    status: 'solved',
    value: 2.85,
  });
  expect(checkAnswer('2,80', 2.85)).toStrictEqual({
    status: 'solved',
    value: 2.8,
  });
  expect(checkAnswer('2.90', 2.85)).toStrictEqual({
    status: 'solved',
    value: 2.9,
  });
  expect(checkAnswer('2.79', 2.85)).toStrictEqual({
    status: 'wrong',
    value: 2.79,
  });
  expect(checkAnswer('4.7', 2.85)).toStrictEqual({
    status: 'wrong',
    value: 4.7,
  });
});
