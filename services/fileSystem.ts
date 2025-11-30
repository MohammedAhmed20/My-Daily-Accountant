
export const fileSystemService = {
  isSupported: () => 'showSaveFilePicker' in window,

  createFile: async () => {
    // @ts-ignore - File System Access API
    const opts = {
      types: [{
        description: 'My Daily Accountant Data',
        accept: { 'application/json': ['.json'] },
      }],
    };
    // @ts-ignore
    return await window.showSaveFilePicker(opts);
  },

  openFile: async () => {
    // @ts-ignore
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'My Daily Accountant Data',
        accept: { 'application/json': ['.json'] },
      }],
      multiple: false,
    });
    return handle;
  },

  save: async (fileHandle: any, data: any) => {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  },

  load: async (fileHandle: any) => {
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  }
};
