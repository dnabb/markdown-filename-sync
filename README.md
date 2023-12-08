# Markdown Filename Sync

Rename markdown files to match their first header.  

## Features

Adds a `Markdown: rename using first header` entry in the command palette which will rename the current markdown file to match the first header found in the file itself.  
Optionally, it can also rename *related files* (files whose name begins with the same name of the current markdown file). This also updates every reference to those file within the markdown.  
This is mostly useful in systems where images and other attachments are stored in the same folder as the markdown with a matching filename.  

## Extension Settings

`markdown-filename-sync.renamingBehavior`: optionally transform the header before renaming.  

Possible options:
- `doNothing`: Do nothing and use header as is. Headers with characters that are not filename-safe will fail.
- `removeUnsafe`: Remove non-filename-safe characters (`/\\#%&{}<>?*$!\'":@+``|=`).
- `slugify`: Use slug (from [github-slugger](https://github.com/Flet/github-slugger)) as file name.

`markdown-filename-sync.renameRelatedFiles`: whether or not *related files* (files whose name begins with the same name of the current markdown file) should also be renamed.  
`markdown-filename-sync.relatedFileExtensions` which extensions to consider related to the current file.

## Known Issues

Links pointing to the renamed markdown file will not be updated.  