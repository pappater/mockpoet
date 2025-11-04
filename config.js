// Configuration file for rabbit app
const CONFIG = {
  // Multiple novels configuration
  novels: {
    weight_of_promises: {
      title: "The Weight of Promises",
      gist: {
        username: 'pappater',
        id: '51893c25959355bda1884804375ec3d8'
      },
      localPath: 'docs/novel-gist'
    },
    indifferent_shore: {
      title: "The Indifferent Shore",
      gist: {
        username: 'pappater',
        id: ''  // Will be set via STRANGER_GIST_ID secret
      },
      localPath: 'docs/stranger-novel'
    }
  },
  
  // Legacy configuration for backward compatibility
  gist: {
    username: 'pappater',
    id: '51893c25959355bda1884804375ec3d8'
  },
  localPath: 'docs/novel-gist'
};
