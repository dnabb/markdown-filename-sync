import * as vscode from 'vscode';
import * as path from 'path';
import remark from 'remark';
import linkRewrite from 'remark-link-rewrite';

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
                        const dir = path.dirname(newFileUri.fsPath);
                        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));

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

                        const text = (await vscode.workspace.openTextDocument(newFileUri)).getText();

                        // Create a function to update the links
                        const updateLink = (url) => {
                            const oldFilename = path.basename(document.fileName, '.md');
                            if (url.includes(oldFilename)) {
                                return url.replace(oldFilename, filename);
                            }
                            return url;
                        };

                        // Use remark to parse and update the links
                        const updatedText = await new Promise((resolve, reject) => {
                            remark()
                                .use(linkRewrite, updateLink)
                                .process(text, (err, file) => {
                                    if (err) reject(err);
                                    else resolve(String(file));
                                });
                        });

                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(newFileUri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(text.length, 0)), updatedText);
                        await vscode.workspace.applyEdit(edit);
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
