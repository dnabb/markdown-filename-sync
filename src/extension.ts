import * as vscode from 'vscode';
import * as path from 'path';

export async function activate(context: vscode.ExtensionContext) {
    const Slugger = require('github-slugger');
    const slugger = new Slugger();
    const UNALLOWED_CHARS = '/\\\\#%&{}<>?*$!\'":@+`|=';
    const UNALLOWED_REGEX = new RegExp(`[${UNALLOWED_CHARS}]`, 'g');

    let disposable = vscode.commands.registerCommand('markdown-filename-sync.renameFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            if (document.languageId === 'markdown') {
                const firstHeader = document.getText().match(/^#+\s*(.*)$/m);
                if (firstHeader) {
                    let filename = firstHeader[1];
                    const renamingBehavior = vscode.workspace.getConfiguration('markdown-filename-sync').get('renamingBehavior');
                    if (renamingBehavior === 'removeUnsafe') {
                        filename = filename.replace(UNALLOWED_REGEX, '');
                    } else if (renamingBehavior === 'slugify') {
                        slugger.reset();  // Reset the slugger's history
                        filename = slugger.slug(filename);
                    }
                    const fileUri = document.uri;
                    const newFileUri = vscode.Uri.file(fileUri.fsPath.replace(/[^\/\\]*$/, `${filename}.md`));
                    await vscode.workspace.fs.rename(fileUri, newFileUri);

                    const renameRelatedFiles = vscode.workspace.getConfiguration('markdown-filename-sync').get('renameRelatedFiles');
                    const relatedFileExtensions: string[] = vscode.workspace.getConfiguration('markdown-filename-sync').get('relatedFileExtensions') as string[];

                    if (renameRelatedFiles) {
                        // Get the directory of the current file
                        const dir = path.dirname(newFileUri.fsPath);

                        // Get all files in the directory
                        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));

                        // Loop through the files
                        for (const [file, type] of files) {
                            // If the file is not a directory, starts with the old filename, and has a related file extension
                            if (type === vscode.FileType.File && file.startsWith(path.basename(document.fileName, '.md')) && relatedFileExtensions.includes(path.extname(file))) {
                                // Construct the new filename
                                const newFilename = file.replace(path.basename(document.fileName, '.md'), filename);

                                // Rename the file
                                const oldFileUri = vscode.Uri.file(path.join(dir, file));
                                const newFileUri = vscode.Uri.file(path.join(dir, newFilename));
                                await vscode.workspace.fs.rename(oldFileUri, newFileUri);
                            }
                        }

                        // Updates whenever the old filenames were mentioned in the markdown.
                        // This effectively also updates the links
                        const text = (await vscode.workspace.openTextDocument(newFileUri)).getText();

                        // Check if the old filename is part of a markdown header
                        if (!firstHeader[0].includes(path.basename(document.fileName, '.md'))) {
                            const updatedText = text.replace(new RegExp(path.basename(document.fileName, '.md'), 'g'), filename);
                            const edit = new vscode.WorkspaceEdit();
                            edit.replace(newFileUri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(text.length, 0)), updatedText);
                            await vscode.workspace.applyEdit(edit);
                        }
                    }
                } else {
                    vscode.window.showErrorMessage('No markdown header found in the file.');
                }
            }
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

