# Markdown Filename Sync

Rename markdown files to match their first header.  

## Features

Adds a `Markdown: rename using first header` entry in the command palette which will rename the current markdown file to match the first header found in the file itself.  

## Extension Settings

`markdown-filename-sync.renamingBehavior`: optionally transform the header before renaming.  

Possible options:
- `doNothing`: Do nothing and use header as is. Headers with characters that are not filename-safe will fail.
- `removeUnsafe`: Remove non-filename-safe characters (`/\\#%&{}<>?*$!\'":@+``|=`).
- `slugify`: Use slug (from [github-slugger](https://github.com/Flet/github-slugger)) as file name.

## Known Issues

Links pointing to the renamed markdown file will not be updated.