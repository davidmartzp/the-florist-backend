<?php
declare(strict_types=1);

namespace App\Utils;

/**
 * Genera slugs URL-amigables.
 * Equivale a src/utils/slugify.js del proyecto Node.
 */
class Slugify
{
    public static function make(string $text): string
    {
        $text = mb_strtolower(trim($text));

        // Normalizar acentos: usa intl si está disponible, manual como fallback
        if (function_exists('transliterator_transliterate')) {
            $text = (string) (transliterator_transliterate('Any-Latin; Latin-ASCII', $text) ?? $text);
        } else {
            $from = ['á','é','í','ó','ú','ü','ñ','à','è','ì','ò','ù','â','ê','î','ô','û','ä','ë','ï','ö','ú'];
            $to   = ['a','e','i','o','u','u','n','a','e','i','o','u','a','e','i','o','u','a','e','i','o','u'];
            $text = str_replace($from, $to, $text);
        }

        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
        return trim($text, '-');
    }
}
