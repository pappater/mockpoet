// Configuration file for rabbit app
export const CONFIG = {
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
        id: 'b12ff3b5ea6e9f42a7becfc2cc1aeece'
      },
      localPath: 'docs/stranger-novel'
    },
    moonbound_devotion: {
      title: "Moonbound Devotion",
      gist: {
        username: 'pappater',
        id: ''
      },
      localPath: 'docs/werewolf-novel'
    }
  },
  
  // Legacy configuration for backward compatibility
  gist: {
    username: 'pappater',
    id: '51893c25959355bda1884804375ec3d8'
  },
  localPath: 'docs/novel-gist'
};
