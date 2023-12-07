import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    const Slugger = (await import('github-slugger')).default;
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
                } else {
                    vscode.window.showErrorMessage('No markdown header found in the file.');
                }
            }
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
