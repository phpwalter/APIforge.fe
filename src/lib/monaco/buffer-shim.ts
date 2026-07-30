export const Buffer = {
  isBuffer: () => false,
  from: () => {
    throw new Error('Buffer is not supported in the browser');
  },
};

const shim = {
  Buffer,
};

export default shim;
