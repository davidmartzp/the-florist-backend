FROM php:8.2-apache

# ── Dependencias del sistema ─────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
        libicu-dev \
        unzip \
    && rm -rf /var/lib/apt/lists/*

# ── Extensiones PHP ──────────────────────────────────────────────────────────
RUN docker-php-ext-configure intl \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        intl

# ── Apache: habilitar mod_rewrite ───────────────────────────────────────────
RUN a2enmod rewrite

# ── VirtualHost: document root apunta a public/ ─────────────────────────────
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# ── Composer ─────────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
