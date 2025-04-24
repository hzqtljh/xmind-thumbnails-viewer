import { Plugin, MarkdownView, WorkspaceLeaf, TFile, App, Setting, PluginSettingTab } from 'obsidian';

const JSZip = require('jszip');

interface XMindPluginSettings {
  xmindFolderPath: string;
  showOpenButton: boolean;
  defaultZoom: number; // Default zoom level
  defaultAlignment: string; // Default alignment
}

const DEFAULT_SETTINGS: XMindPluginSettings = {
  xmindFolderPath: '/drafts/xmind',
  showOpenButton: true,
  defaultZoom: 1.0, // Default zoom level
  defaultAlignment: 'center', // Default alignment
};

export default class XMindPreviewPlugin extends Plugin {
  settings: XMindPluginSettings;

  async onload() {
    await this.loadSettings();

    // Register the settings tab
    this.addSettingTab(new XMindSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('xmind', async (source, el, ctx) => {
      let filePath: string | null = null;
      let zoomLevel: number = this.settings.defaultZoom; // Use default zoom level if not specified
      let buttonDisplay: boolean | null = null; // Default is null
      let alignment: string = this.settings.defaultAlignment; // Use default alignment if not specified

      // Parse parameters from the source
      const lines = source.split('\n');
      for (const line of lines) {
        const nameMatch = line.match(/name:\s*(.*)/);
        if (nameMatch) {
          const fileName = nameMatch[1].trim();
          filePath = `${this.settings.xmindFolderPath}/${fileName}.xmind`;
        }

        const pathMatch = line.match(/path:\s*(.*)/);
        if (pathMatch && !filePath) {
          filePath = pathMatch[1].trim();
        }

        const zoomMatch = line.match(/zoom:\s*([\d.]+)/);
        if (zoomMatch) {
          zoomLevel = parseFloat(zoomMatch[1]);
        }

        const buttonDisplayMatch = line.match(/button-display:\s*(true|True|1|false|False|0)/);
        if (buttonDisplayMatch) {
          const value = buttonDisplayMatch[1];
          buttonDisplay = value === 'true' || value === 'True' || value === '1';
        }

        const alignmentMatch = line.match(/alignment:\s*(left|right|center)/);
        if (alignmentMatch) {
          alignment = alignmentMatch[1];
        }
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
        imgElement.style.width = `${100 * zoomLevel}%`; // Set width based on zoom level
        imgElement.style.height = 'auto'; // Maintain aspect ratio

        // Create a container to center the image
        const imageContainer = document.createElement('div');
        imageContainer.style.position = 'relative';
        imageContainer.style.width = '100%'; // Ensure container takes full width
        imageContainer.style.display = 'flex';
        imageContainer.style.alignItems = 'center'; // Vertically center the image and button

        // Set alignment style
        switch (alignment) {
          case 'left':
            imageContainer.style.justifyContent = 'flex-start';
            break;
          case 'right':
            imageContainer.style.justifyContent = 'flex-end';
            break;
          case 'center':
          default:
            imageContainer.style.justifyContent = 'center';
            break;
        }

        // Add a button to open the XMind file
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'absolute';
        buttonContainer.style.bottom = '8px'; // Move to bottom
        buttonContainer.style.display = 'none'; // Initially hidden

        const openButton = document.createElement('button');
        openButton.innerText = 'Open';
        openButton.style.padding = '4px 8px';
        openButton.style.fontSize = '12px';
        openButton.style.cursor = 'pointer';
        openButton.style.background = 'transparent'; // Transparent background
        openButton.style.border = 'none';
        openButton.style.boxShadow = 'none'; // Remove shadow
        openButton.style.color = 'var(--text-accent)'; // Text color set to theme accent

        openButton.onclick = () => {
          this.app.workspace.openLinkText(file.path, '');
        };

        // Add hover effect using CSS
        openButton.addEventListener('mouseenter', () => {
          openButton.style.textDecoration = 'underline'; // Underline on hover
        });

        openButton.addEventListener('mouseleave', () => {
          openButton.style.textDecoration = 'none'; // No underline when not hovered
        });

        buttonContainer.appendChild(openButton);

        // Append the image element to the container
        imageContainer.appendChild(imgElement);
        imageContainer.appendChild(buttonContainer);
        el.appendChild(imageContainer);

        // Determine whether to show the button
        const shouldShowButton = buttonDisplay !== null ? buttonDisplay : this.settings.showOpenButton;

        // Show button only if setting is enabled and mouse hovers over the image or button
        if (shouldShowButton) {
          let isMouseOverButton = false;

          imgElement.addEventListener('mouseenter', () => {
            buttonContainer.style.display = 'block';
          });

          imgElement.addEventListener('mouseleave', () => {
            if (!isMouseOverButton) {
              buttonContainer.style.display = 'none';
            }
          });

          buttonContainer.addEventListener('mouseenter', () => {
            isMouseOverButton = true;
            buttonContainer.style.display = 'block';
          });

          buttonContainer.addEventListener('mouseleave', () => {
            isMouseOverButton = false;
            buttonContainer.style.display = 'none';
          });
        }

        // Adjust button position based on alignment
        switch (alignment) {
          case 'left':
            buttonContainer.style.left = '8px'; // Left align button
            break;
          case 'right':
            buttonContainer.style.right = '8px'; // Right align button
            break;
          case 'center':
          default:
            buttonContainer.style.left = '50%'; // Center align button
            buttonContainer.style.transform = 'translateX(-50%)';
            break;
        }
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

    new Setting(containerEl)
      .setName('Show Open Button')
      .setDesc('Enable or disable the "Open" button in the XMind preview by default.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showOpenButton)
          .onChange(async (value) => {
            this.plugin.settings.showOpenButton = value;
            await this.plugin.saveSettings();
            this.plugin.scanAndRenderAllXMindBlocks(); // Re-render all blocks to apply changes
          }));

    new Setting(containerEl)
      .setName('Default Zoom Level')
      .setDesc('Set the default zoom level for XMind previews.')
      .addSlider(slider =>
        slider
          .setLimits(0.5, 1.0, 0.1) // Min, Max, Step
          .setValue(this.plugin.settings.defaultZoom)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.defaultZoom = value;
            await this.plugin.saveSettings();
            this.plugin.scanAndRenderAllXMindBlocks(); // Re-render all blocks to apply changes
          }));

    new Setting(containerEl)
      .setName('Default Alignment')
      .setDesc('Set the default alignment for XMind previews.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('left', 'Left')
          .addOption('center', 'Center')
          .addOption('right', 'Right')
          .setValue(this.plugin.settings.defaultAlignment)
          .onChange(async (value) => {
            this.plugin.settings.defaultAlignment = value;
            await this.plugin.saveSettings();
            this.plugin.scanAndRenderAllXMindBlocks(); // Re-render all blocks to apply changes
          }));
  }
}



