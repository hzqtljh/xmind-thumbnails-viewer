import { Plugin, MarkdownView, WorkspaceLeaf, TFile, App, Setting, PluginSettingTab } from 'obsidian';

const JSZip = require('jszip');

interface XMindPluginSettings {
  xmindFolderPath: string;
}

const DEFAULT_SETTINGS: XMindPluginSettings = {
  xmindFolderPath: '/drafts/xmind',
};

export default class XMindPreviewPlugin extends Plugin {
  settings: XMindPluginSettings;

  async onload() {
    await this.loadSettings();

    // Register the settings tab
    this.addSettingTab(new XMindSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('xmind', async (source, el, ctx) => {
      let filePath: string | null = null;

      // Check for simplified format: name: <filename>
      const nameMatch = source.match(/name:\s*(.*)/);
      if (nameMatch) {
        const fileName = nameMatch[1].trim();
        filePath = `${this.settings.xmindFolderPath}/${fileName}.xmind`;
      }

      // Check for original format: path: <filepath>
      const pathMatch = source.match(/path:\s*(.*)/);
      if (pathMatch && !filePath) {
        filePath = pathMatch[1].trim();
      }

      if (!filePath) {
        console.error("No valid file path provided.");
        el.innerText = "Failed to load XMind preview.";
        return;
      }

      console.log(`Attempting to load XMind file at: ${filePath}`);

      try {
        let currentFilePath: string | undefined = undefined;
        const activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeLeaf && activeLeaf.file) {
          currentFilePath = activeLeaf.file.path;
        }

        if (!currentFilePath) {
          throw new Error("Could not determine the current Markdown file path.");
        }

        // Determine if the path is absolute or relative
        let resolvedPath: string;
        if (filePath.startsWith('/')) {
          // Absolute path
          resolvedPath = filePath.substring(1); // Remove leading '/'
        } else {
          // Relative path
          resolvedPath = this.resolveRelativePath(currentFilePath, filePath);
        }

        let file = this.app.vault.getAbstractFileByPath(resolvedPath) as TFile;

        if (!file) {
          // If relative path fails, try absolute path
          resolvedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
          file = this.app.vault.getAbstractFileByPath(resolvedPath) as TFile;

          if (!file) {
            throw new Error(`File does not exist: ${resolvedPath}`);
          }
        }

        // Read the file content as binary
        const data = await this.app.vault.readBinary(file);
        console.log(`Successfully read XMind file.`);

        const zip = new JSZip();
        await zip.loadAsync(data);
        console.log(`Successfully loaded ZIP archive.`);

        // Directly read Thumbnails/thumbnail.png file
        const thumbnailFile = zip.file('Thumbnails/thumbnail.png');
        if (!thumbnailFile) {
          throw new Error('Thumbnail not found in the XMind file.');
        }
        console.log(`Found thumbnail file.`);

        const imageData = await thumbnailFile.async('arraybuffer');
        const base64Image = Buffer.from(imageData).toString('base64');
        const imgElement = document.createElement('img');
        imgElement.src = `data:image/png;base64,${base64Image}`;
        imgElement.style.maxWidth = '100%';
        el.appendChild(imgElement);
        console.log(`Successfully embedded thumbnail image.`);
      } catch (error) {
        console.error("Error processing XMind file:", error);
        el.innerText = "Failed to load XMind preview.";
      }
    });

    this.app.workspace.onLayoutReady(() => {
      this.scanAndRenderAllXMindBlocks();
    });
  }

  resolveRelativePath(basePath: string, relativePath: string): string {
    const baseDir = basePath.split('/').slice(0, -1).join('/');
    const pathParts = relativePath.split('/');
    let resultParts = baseDir.split('/');

    for (const part of pathParts) {
      if (part === '..') {
        resultParts.pop();
      } else if (part !== '.') {
        resultParts.push(part);
      }
    }

    return resultParts.join('/');
  }

  scanAndRenderAllXMindBlocks() {
    this.app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
      if (this.isMarkdownView(leaf)) {
        leaf.view.requestSave();
      }
    });
  }

  isMarkdownView(leaf: WorkspaceLeaf): leaf is WorkspaceLeaf & { view: MarkdownView } {
    return leaf.view.getViewType() === 'markdown';
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class XMindSettingTab extends PluginSettingTab {
  plugin: XMindPreviewPlugin;

  constructor(app: App, plugin: XMindPreviewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'XMind Preview Settings' });

    new Setting(containerEl)
      .setName('XMind Folder Path')
      .setDesc('Enter the folder path where your XMind files are stored.')
      .addText(text =>
        text
          .setPlaceholder('e.g. /drafts/xmind')
          .setValue(this.plugin.settings.xmindFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.xmindFolderPath = value.trim();
            await this.plugin.saveSettings();
          }));
  }
}



