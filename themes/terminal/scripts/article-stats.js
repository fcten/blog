'use strict';

const { stripHTML, unescapeHTML } = require('hexo-util');

const DEFAULT_CJK_CHARACTERS_PER_MINUTE = 300;
const DEFAULT_WORDS_PER_MINUTE = 200;
const BLOCK_TAG_PATTERN = /<\/?(?:address|article|aside|blockquote|br|dd|div|dl|dt|figcaption|figure|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b[^>]*>/gi;
const HAN_CHARACTER_PATTERN = /\p{Script=Han}/gu;
const NON_CJK_WORD_PATTERN = /[\p{L}\p{N}]+(?:[.'’_-][\p{L}\p{N}]+)*/gu;
const HTML_ENTITY_PATTERN = /&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);/gi;

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function articleStats(content, options = {}) {
  const html = String(content || '').replace(BLOCK_TAG_PATTERN, ' ');
  const text = unescapeHTML(stripHTML(html))
    .replace(HTML_ENTITY_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cjkCharacters = (text.match(HAN_CHARACTER_PATTERN) || []).length;
  const nonCjkText = text.replace(HAN_CHARACTER_PATTERN, ' ');
  const words = (nonCjkText.match(NON_CJK_WORD_PATTERN) || []).length;
  const total = cjkCharacters + words;

  const cjkSpeed = positiveNumber(
    options.cjk_characters_per_minute,
    DEFAULT_CJK_CHARACTERS_PER_MINUTE
  );
  const wordSpeed = positiveNumber(
    options.words_per_minute,
    DEFAULT_WORDS_PER_MINUTE
  );
  const minutes = total > 0
    ? Math.max(1, Math.ceil(cjkCharacters / cjkSpeed + words / wordSpeed))
    : 0;

  return {
    cjkCharacters,
    words,
    total,
    formattedTotal: total.toLocaleString('zh-CN'),
    minutes
  };
}

hexo.extend.helper.register('article_stats', articleStats);
