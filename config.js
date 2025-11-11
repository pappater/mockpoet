// Configuration file for mockpoet app
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
        id: 'b12ff3b5ea6e9f42a7becfc2cc1aeece'  // Will be set via STRANGER_GIST_ID secret
      },
      localPath: 'docs/stranger-novel'
    },
    moonbound_devotion: {
      title: "Moonbound Devotion",
      gist: {
        username: 'pappater',
        id: 'af676da598e2040a0cdd2cb4b9ca48e3'  // Will be set via WEREWOLF_GIST_ID secret by GitHub Actions workflow
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
        id: 'f80e0314b03be59d97a32e27f1fce44c'  // Will be set via HYDROGEN_JUKEBOX_GIST_ID secret by GitHub Actions workflow
      },
      localPath: 'docs/hydrogen-jukebox',
      type: 'poems'  // Flag to indicate this is a poem collection
    },
    of_old_man: {
      title: "Of Old Man",
      gist: {
        username: 'pappater',
        id: '9fa4af8eb29c0097cc525f2d38503c2e'  // Will be set via OF_OLD_MAN_GIST_ID secret by GitHub Actions workflow
      },
      localPath: 'docs/of-old-man',
      type: 'poems'  // Flag to indicate this is a poem collection
    },
    sun_also_rises_again: {
      title: "The Sun Also Rises Again",
      gist: {
        username: 'pappater',
        id: 'a438cb90b4c76029c58cf54d66b22135'  // Will be set via HEMINGWAY_GIST_ID secret
      },
      localPath: 'docs/hemingway-novel'
    },
    clueless_mind: {
      title: "Clueless Mind",
      gist: {
        username: 'pappater',
        id: '3a3f09a5c44889a6f40419f080b15437'
      },
      localPath: 'docs/clueless-mind'
    },
    absurd_ascent: {
      title: "The Absurd Ascent",
      gist: {
        username: 'pappater',
        id: 'e8e6f2e6c00d3abcf9a407e2d014d8bd'  // Will be set via FARCE_DRAMA_GIST_ID secret by GitHub Actions workflow
      },
      localPath: 'docs/farce-drama',
      type: 'drama'  // Flag to indicate this is a drama
    },
    bureaucratic_odyssey: {
      title: "The Bureaucratic Odyssey",
      gist: {
        username: 'pappater',
        id: ''  // Will be set via SATIRE_GIST_ID secret by GitHub Actions workflow
      },
      localPath: 'docs/satire-novel',
      type: 'novel'  // Fiction novel
    }
  },
  
  // Legacy configuration for backward compatibility
  gist: {
    username: 'pappater',
    id: '51893c25959355bda1884804375ec3d8'
  },
  localPath: 'docs/novel-gist'
};
