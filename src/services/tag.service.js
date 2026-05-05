const Tag = require('../models/Tag');
const HttpError = require('../utils/http-error');
const slugify = require('../utils/slugify');

function validateName(name) {
  const normalizedName = String(name || '').trim();

  if (!normalizedName) {
    throw new HttpError(400, 'name is required');
  }

  return normalizedName;
}

function resolveSlug(name, customSlug) {
  const source = customSlug !== undefined ? customSlug : name;
  const slug = slugify(source);

  if (!slug) {
    throw new HttpError(400, 'A valid slug could not be generated');
  }

  return slug;
}

async function ensureTagExists(tagId) {
  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw new HttpError(404, 'Tag not found');
  }

  return tag;
}

async function ensureSlugIsAvailable(slug, excludedId = null) {
  const existingTag = await Tag.findBySlug(slug);

  if (existingTag && existingTag.id !== Number(excludedId)) {
    throw new HttpError(409, 'A tag with that slug already exists');
  }
}

async function createTag(payload) {
  const name = validateName(payload.name);
  const slug = resolveSlug(name, payload.slug);

  await ensureSlugIsAvailable(slug);

  return Tag.create({ name, slug });
}

async function toggleTagActive(tagId) {
  const tag = await ensureTagExists(tagId);
  const nextActive = !tag.isActive;
  await Tag.update(tagId, { isActive: nextActive });
  return { message: nextActive ? 'Tag activated successfully' : 'Tag deactivated successfully', isActive: nextActive };
}

module.exports = {
  createTag,
  toggleTagActive,
};
