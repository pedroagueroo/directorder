# Git hooks — registro de cambios en la base de datos

## Qué hace

El hook **`post-commit`** (en `.githooks/post-commit`) ejecuta `scripts/append-database-changelog.js` después de cada commit.

Si ese commit incluye cambios en archivos “de base de datos”, se agrega una sección a **`docs/DATABASE_CHANGES.md`** con:

- fecha (UTC),
- hash corto del commit,
- mensaje del commit,
- lista de archivos tocados que coinciden con los patrones.

Así podés hacer **commit + push** y mandarle a tu amigo el `docs/DATABASE_CHANGES.md` actualizado (o solo las últimas entradas).

## Activación (una vez por clon)

**Opción A — al instalar dependencias**

Tras `npm install` se ejecuta el script `prepare`, que configura:

```text
git config core.hooksPath .githooks
```

**Opción B — manual**

```bash
git config core.hooksPath .githooks
```

Comprobar:

```bash
git config core.hooksPath
```

Debe mostrar `.githooks`.

## Archivos que disparan una entrada

- `scripts/**/*.sql`
- `scripts/setup-supabase.js`
- `scripts/seed-supabase.js`
- `scripts/migrate*.js`

Si el commit no toca ninguno de estos, no se escribe nada nuevo (para no llenar el log).

## Nota sobre push

El hook corre en **commit**, no en push. Después de commitear, el script deja **`docs/DATABASE_CHANGES.md` modificado y en staging** y muestra un aviso. Para dejar **un solo commit** con código + changelog:

```bash
git commit --amend --no-edit --no-verify
```

Si preferís, podés hacer un **segundo commit** solo con el changelog (sin amend).

## Push

Hacé `git push` cuando el changelog ya esté incluido en un commit (amend o commit extra).
