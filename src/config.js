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
        id: 'af676da598e2040a0cdd2cb4b9ca48e3'
      },
      localPath: 'docs/werewolf-novel'
    },
    flying_banana: {
      title: "Flying Banana",
      gist: {
        username: 'pappater',
        id: 'efc9cfe56f7bc265ec0043f0ffbd533c'  // Will be set via FLYING_BANANA_GIST_ID secret by GitHub Actions workflow
      },
      localPath: 'docs/flying-banana',
      type: 'short_stories'  // Flag to indicate this is a short story collection
    },
    hydrogen_jukebox: {
      title: "Hydrogen Jukebox",
      gist: {
        username: 'pappater',
        id: ''  // Will be set via HYDROGEN_JUKEBOX_GIST_ID secret by GitHub Actions workflow
      },
      localPath: 'docs/hydrogen-jukebox',
      type: 'poems'  // Flag to indicate this is a poem collection
    }
  },
  
  // Legacy configuration for backward compatibility
  gist: {
    username: 'pappater',
    id: '51893c25959355bda1884804375ec3d8'
  },
  localPath: 'docs/novel-gist'
};
