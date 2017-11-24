"use strict";
var vv = vv || {
  consts: {playlistLength: 9999},
  obj: {},
  song: {},
  songs: {},
  storage: {},
  model: {list: {}},
  view:
      {main: {}, list: {}, system: {}, popup: {}, modal: {help: {}, song: {}}},
  control: {},
};
vv.obj = (function() {
  var pub = {};
  pub.getOrElse = function(m, k, v) { return k in m ? m[k] : v; };
  pub.copy = function(t) {
    var ret = {};
    if (Object.prototype.toString.call(t) == "[object Array]") {
      ret = [];
    }
    for (var i in t) {
      ret[i] = t[i];
    }
    return ret;
  };
  return pub;
})();
vv.song = (function() {
  var pub = {};
  var tag = function(song, keys, other) {
    var i;
    for (i in keys) {
      var key = keys[i];
      if (key in song) {
        return song[key];
      }
    }
    return other;
  };
  var getOrElse = function(song, key, other) {
    var ret = getOrElseMulti(song, key, null);
    if (!ret) {
      return other;
    }
    return ret.join();
  };
  var getOrElseMulti = function(song, key, other) {
    if (key in song) {
      return song[key];
    } else if (key == "AlbumSort") {
      return tag(song, ["Album"], other);
    } else if (key == "ArtistSort") {
      return tag(song, ["Artist"], other);
    } else if (key == "AlbumArtist") {
      return tag(song, ["Artist"], other);
    } else if (key == "AlbumArtistSort") {
      return tag(song, ["AlbumArtist", "Artist"], other);
    } else if (key == "AlbumSort") {
      return tag(song, ["Album"], other);
    } else {
      return other;
    }
  };
  var getOneOrElse = function(song, key, other) {
    if (!song.keys) {
      return getOrElseMulti(song, key, [other])[0];
    }
    for (var i in song.keys) {
      if (song.keys[i][0] == key) {
        return song.keys[i][1];
      }
    }
    return getOrElseMulti(song, key, [other])[0];
  };
  pub.getOne = function(song, key) {
    return getOneOrElse(song, key, "[no " + key + "]");
  };
  pub.get = function(song, key) {
    return getOrElse(song, key, "[no " + key + "]");
  };
  pub.sortkeys = function(song, keys, memo) {
    var songs = [vv.obj.copy(song)];
    songs[0].sortkey = "";
    songs[0].keys = [];
    for (var i in keys) {
      var writememo = memo.indexOf(keys[i]) != -1;
      var newkeys = getOrElseMulti(song, keys[i], []);
      if (newkeys.length == 0) {
        for (var j in songs) {
          songs[j].sortkey += " ";
          if (writememo) {
            songs[j].keys.push([keys[i], "[no " + keys[i] + "]"]);
          }
        }
      } else if (newkeys.length == 1) {
        for (j in songs) {
          songs[j].sortkey += newkeys[0];
          if (writememo) {
            songs[j].keys.push([keys[i], newkeys[0]]);
          }
        }
      } else {
        var newsongs = [];
        for (j in songs) {
          for (var k in newkeys) {
            var newsong = vv.obj.copy(songs[j]);
            newsong.keys = vv.obj.copy(songs[j].keys);
            newsong.sortkey += newkeys[k];
            if (writememo) {
              newsong.keys.push([keys[i], newkeys[k]]);
            }
            newsongs.push(newsong);
          }
        }
        songs = newsongs;
      }
    }
    return songs;
  };
  pub.element = function(e, song, key, style) {
    e.classList.remove("plain");
    e.classList.remove("song");
    e.classList.remove("album");
    e.classList.remove("playing");
    e.classList.add(style);
    e.classList.add("note-line");
    e.setAttribute("key", vv.song.getOne(song, key));
    if (song["file"]) {
      e.setAttribute("pos", song["pos"]);
      e.setAttribute("contextmenu", "conext-" + song.file[0]);
      var menu = document.createElement("menu");
      menu.setAttribute("type", "context");
      menu.classList.add("contextmenu");
      menu.id = "conext-" + song.file[0];
      var menuitem;
      menuitem = document.createElement("menuitem");
      menuitem.setAttribute("label", "Song Infomation");
      menuitem.addEventListener("click", function(e) {
        vv.view.modal.song.show(song);
        e.stopPropagation();
      });
      menu.appendChild(menuitem);
      e.appendChild(menu);
    }
    if (style == "song") {
      var now_playing = vv.storage.current && vv.storage.current.file &&
          song.file[0] == vv.storage.current.file[0];
      if (now_playing) {
        e.classList.add("playing");
      }
      if (song.file) {
        var tooltip = vv.song.get(song, "Title") + "\n";
        var keys = ["Length", "Artist", "Album", "Track", "Genre", "Performer"];
        for (var i in keys) {
          tooltip += keys[i] + ": " + vv.song.get(song, keys[i]) + "\n";
        }
        e.setAttribute("title", tooltip);
      }
      var track = document.createElement("span");
      track.classList.add("song-track");
      track.textContent = vv.song.get(song, "TrackNumber");
      e.appendChild(track);
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("song-playingicon");
      svg.setAttribute("width", "22");
      svg.setAttribute("height", "22");
      svg.setAttribute("viewBox", "0 0 100 100");
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add("fill");
      path.setAttribute("d", "M 25,20 80,50 25,80 z");
      svg.appendChild(path);
      e.appendChild(svg);
      var title = document.createElement("span");
      title.classList.add("song-title");
      title.textContent = vv.song.get(song, "Title");
      e.appendChild(title);
      var artist = document.createElement("span");
      artist.classList.add("song-artist");
      artist.textContent = vv.song.get(song, "Artist");
      if (vv.song.get(song, "Artist") != vv.song.get(song, "AlbumArtist")) {
        artist.classList.add("low-prio");
      }
      e.appendChild(artist);
      if (now_playing) {
        var elapsed = document.createElement("span");
        elapsed.classList.add("song-elapsed");
        elapsed.classList.add("elapsed");
        e.appendChild(elapsed);
        var length_separator = document.createElement("span");
        length_separator.classList.add("song-lengthseparator");
        length_separator.textContent = "/";
        e.appendChild(length_separator);
      }
      var length = document.createElement("span");
      length.classList.add("song-length");
      length.textContent = vv.song.get(song, "Length");
      e.appendChild(length);
    } else if (style == "album") {
      var cover_path = "/assets/nocover.svg";
      if (song.cover) {
        cover_path = "/music_directory/" + song.cover;
      }
      var imgbox = document.createElement("div");
      imgbox.classList.add("album-imgbox");
      var cover = document.createElement("img");
      cover.classList.add("album-imgbox-cover");
      cover.src = cover_path;
      imgbox.appendChild(cover);
      e.appendChild(imgbox);

      var detail = document.createElement("div");
      detail.classList.add("album-detail");
      var date = document.createElement("span");
      date.classList.add("album-detail-date");
      date.textContent = vv.song.get(song, "Date");
      detail.appendChild(date);
      var album = document.createElement("span");
      album.classList.add("album-detail-album");
      album.textContent = vv.song.get(song, "Album");
      detail.appendChild(album);
      var albumartist = document.createElement("span");
      albumartist.classList.add("album-detail-albumartist");
      albumartist.textContent = vv.song.get(song, "AlbumArtist");
      detail.appendChild(albumartist);
      e.appendChild(detail);
    } else {
      var plain = document.createElement("span");
      plain.classList.add("plain-key");
      plain.textContent = vv.song.getOne(song, key);
      e.appendChild(plain);
    }
    return e;
  };

  return pub;
}());
vv.songs = (function() {
  var pub = {};
  pub.sort = function(songs, keys, memo) {
    var newsongs = [];
    for (var i in songs) {
      Array.prototype.push.apply(
          newsongs, vv.song.sortkeys(songs[i], keys, memo));
    }
    var sorted = newsongs.sort(function(a, b) {
      if (a.sortkey < b.sortkey) {
        return -1;
      } else {
        return 1;
      }
    });
    for (i in sorted) {
      sorted[i]["pos"] = [i];
    }
    return sorted;
  };
  pub.uniq = function(songs, key) {
    return songs.filter(function(song, i, self) {
      if (i == 0) {
        return true;
      } else if (
          vv.song.getOne(song, key) != vv.song.getOne(self[i - 1], key)) {
        return true;
      } else {
        return false;
      }
    });
  };
  pub.filter = function(songs, filters) {
    return songs.filter(function(song) {
      var f;
      for (f in filters) {
        if (vv.song.getOne(song, f) != filters[f]) {
          return false;
        }
      }
      return true;
    });
  };
  pub.weakFilter = function(songs, filters, max) {
    if (songs.length <= max) {
      return songs;
    }
    for (var i in filters) {
      var newsongs = [];
      for (var j in songs) {
        if (vv.song.getOne(songs[j], filters[i][0]) == filters[i][1]) {
          newsongs.push(songs[j]);
        }
      }
      if (newsongs.length <= max) {
        return newsongs;
      }
      songs = newsongs;
    }
    if (songs.length > max) {
      newsongs = [];
      for (i = 0; i < max; i++) {
        newsongs.push(songs[i]);
      }
    }
    return songs;
  };
  return pub;
}());
vv.storage = (function() {
  var pub = {
    tree: [],
    current: {},
    control: {},
    library: [],
    outputs: [],
    stats: {},
    last_modified: {},
    last_modified_ms: {},
    version: {},
    last_state: "main",
  };
  pub.preferences = {
    "volume": {"show": true, "max": "100"},
    "playback": {"view_follow": true},
    "appearance": {
      "color_threshold": 128,
      "animation": true,
      "background_image": true,
      "background_image_blur": 32,
      "circled_image": true,
      "gridview_album": true,
      "auto_hide_scrollbar": true
    },
  };
  // Presto Opera
  if (navigator.userAgent.indexOf("Presto/2") > 1) {
    pub.preferences.appearance.color_threshold = 256;
    pub.preferences.appearance.background_image_blur = "0";
    pub.preferences.appearance.circled_image = false;
    pub.preferences.volume.show = false;
  }
  pub.save = function() {
    try {
      localStorage.tree = JSON.stringify(pub.tree);
      localStorage.preferences = JSON.stringify(pub.preferences);
      localStorage.last_state = pub.last_state;
      localStorage.current = JSON.stringify(pub.current);
      localStorage.current_last_modified = pub.last_modified.current;
    } catch (e) {
      // private browsing
    }
  };
  pub.save_library = function() {
    try {
      if (localStorage.library_last_modified != pub.last_modified.library) {
        localStorage.library = JSON.stringify(pub.library);
        localStorage.library_last_modified = pub.last_modified.library;
      }
    } catch (e) {
      // private browsing
    }
  };
  pub.load = function() {
    try {
      if (localStorage.tree) {
        pub.tree = JSON.parse(localStorage.tree);
      }
      if (localStorage.preferences) {
        var c = JSON.parse(localStorage.preferences);
        var i, j;
        for (i in c) {
          for (j in c[i]) {
            pub.preferences[i][j] = c[i][j];
          }
        }
      }
      if (localStorage.last_state) {
        pub.last_state = localStorage.last_state;
      }
      if (localStorage.current && localStorage.current_last_modified) {
        var current = JSON.parse(localStorage.current);
        if (Object.prototype.toString.call(current.file) == "[object Array]") {
          pub.current = current;
          pub.last_modified.current = localStorage.current_last_modified;
        }
      }
      if (localStorage.library && localStorage.library_last_modified) {
        var library = JSON.parse(localStorage.library);
        if (library.length) {
          pub.library = library;
          pub.last_modified.library = localStorage.library_last_modified;
        }
      }
    } catch (e) {
      // private browsing
    }
    // Presto Opera
    if (navigator.userAgent.indexOf("Presto/2") > 1) {
      pub.preferences.appearance.animation = false;
    }
    // Mobile
    if (navigator.userAgent.indexOf("Mobile") > 1) {
      pub.preferences.appearance.auto_hide_scrollbar = false;
    }
  };
  pub.load();
  return pub;
}());

vv.model.list = (function() {
  var pub = {};
  var library = {
    "AlbumArtist": [],
    "Album": [],
    "Artist": [],
    "Genre": [],
    "Date": [],
  };
  var TREE = {
    "AlbumArtist": {
      "sort": [
        "AlbumArtist", "Date", "Album", "DiscNumber", "TrackNumber", "Title",
        "file"
      ],
      "tree": [["AlbumArtist", "plain"], ["Album", "album"], ["Title", "song"]],
    },
    "Album": {
      "sort": [
        "AlbumArtist", "AlbumArtist", "Date", "Album", "DiscNumber",
        "TrackNumber", "Title", "file"
      ],
      "tree": [["Album", "album"], ["Title", "song"]],
    },
    "Artist": {
      "sort": [
        "Artist", "Date", "Album", "DiscNumber", "TrackNumber", "Title", "file"
      ],
      "tree": [["Artist", "plain"], ["Title", "song"]],
    },
    "Genre": {
      "sort": ["Genre", "Album", "DiscNumber", "TrackNumber", "Title", "file"],
      "tree": [
        ["Genre", "plain"],
        ["Album", "album"],
        ["Title", "song"],
      ]
    },
    "Date": {
      "sort": ["Date", "Album", "DiscNumber", "TrackNumber", "Title", "file"],
      "tree": [
        ["Date", "plain"],
        ["Album", "album"],
        ["Title", "song"],
      ]
    }
  };
  var focus = {};
  var list_cache = {};
  var listener = {"changed": [], "update": []};
  pub.addEventListener = function(ev, func) { listener[ev].push(func); };
  pub.removeEventListener = function(ev, func) {
    for (var i in listener[ev]) {
      if (listener[ev][i] == func) {
        listener[ev].splice(i, 1);
        return;
      }
    }
  };
  var raiseEvent = function(ev) {
    var i;
    for (i in listener[ev]) {
      listener[ev][i]();
    }
  };
  var mkmemo = function(key) {
    var ret = [];
    for (var i in TREE[key]["tree"]) {
      ret.push(TREE[key]["tree"][i][0]);
    }
    return ret;
  };
  pub.update = function(data) {
    var key;
    for (key in TREE) {
      library[key] = vv.songs.sort(data, TREE[key]["sort"], mkmemo(key));
    }
    update_list();
    raiseEvent("update");
  };
  pub.rootname = function() {
    var r = "root";
    if (vv.storage.tree.length != 0) {
      r = vv.storage.tree[0][1];
    }
    return r;
  };
  pub.filters = function(pos) {
    var root = pub.rootname();
    return library[root][pos].keys;
  };
  pub.focused = function() { return focus; };
  pub.sortkeys = function() {
    var r = pub.rootname();
    if (r == "root") {
      return [];
    }
    return TREE[r]["sort"];
  };
  pub.up = function() {
    var songs = pub.list().songs;
    if (songs[0]) {
      focus = songs[0];
    }
    if (pub.rootname() != "root") {
      vv.storage.tree.pop();
      vv.storage.save();
    }
    update_list();
    if (pub.list().songs.length == 1 && vv.storage.tree.length != 0) {
      pub.up();
    } else {
      raiseEvent("changed");
    }
  };
  pub.down = function(value) {
    var r = pub.rootname();
    var key = "root";
    if (r != "root") {
      key = TREE[r]["tree"][vv.storage.tree.length - 1][0];
    }
    vv.storage.tree.push([key, value]);
    vv.storage.save();
    focus = {};
    update_list();
    var songs = pub.list().songs;
    if (songs.length == 1 && TREE[r]["tree"].length != vv.storage.tree.length) {
      pub.down(vv.song.get(songs[0], pub.list().key));
    } else {
      raiseEvent("changed");
    }
  };

  var absSorted = function(song) {
    var root = "";
    var pos = parseInt(song.Pos[0]);
    var keys = vv.storage.sorted.keys.join();
    for (var newroot in TREE) {
      if (TREE[newroot].sort.join() == keys) {
        root = newroot;
        break;
      }
    }
    if (!root) {
      alert("unknown sort keys:" + keys);
      return;
    }
    var songs = library[root];
    if (!songs) {
      return;
    }
    if (songs.length == 0) {
      return;
    }
    if (songs.length > vv.consts.playlistLength) {
      songs = vv.songs.weakFilter(
          songs, vv.storage.sorted.filters, vv.consts.playlistLength);
    }
    if (!songs[pos]) {
      return;
    }
    if (songs[pos].file[0] == song.file[0]) {
      focus = songs[pos];
      vv.storage.tree.length = 0;
      vv.storage.tree.push(["root", root]);
      for (var i = 0; i < focus.keys.length - 1; i++) {
        vv.storage.tree.push(focus.keys[i]);
      }
      vv.storage.save();
      update_list();
      raiseEvent("changed");
    } else {
      absFallback(song);
    }
  };

  var absFallback = function(song) {
    if (pub.rootname() != "root" && song.file) {
      var r = vv.storage.tree[0];
      vv.storage.tree.length = 0;
      vv.storage.tree.splice(0, vv.storage.tree.length);
      vv.storage.tree.push(r);
      var root = vv.storage.tree[0][1];
      var selected = TREE[root]["tree"];
      for (var i in selected) {
        if (i == selected.length - 1) {
          break;
        }
        var key = selected[i][0];
        vv.storage.tree.push([key, vv.song.getOne(song, key)]);
      }
      vv.storage.save();
    } else {
      vv.storage.tree.splice(0, vv.storage.tree.length);
      vv.storage.save();
    }
    update_list();
    raiseEvent("changed");
  };
  pub.abs = function(song) {
    if (!vv.storage.sorted) {
      return;
    }
    if (vv.storage.sorted.sorted) {
      absSorted(song);
    } else {
      absFallback(song);
    }
  };
  pub.list = function() {
    if (!list_cache.songs || !list_cache.songs.length == 0) {
      update_list();
    }
    return list_cache;
  };
  var update_list = function() {
    if (pub.rootname() == "root") {
      list_cache = list_root();
    } else {
      list_cache = list_child();
    }
  };
  var list_child = function() {
    var root = pub.rootname(), selected_library = library[root], filters = {},
        key = TREE[root]["tree"][vv.storage.tree.length - 1][0],
        style = TREE[root]["tree"][vv.storage.tree.length - 1][1], isdir = true;
    if (vv.storage.tree.length == TREE[root]["tree"].length) {
      isdir = false;
    }
    var leef;
    for (leef in vv.storage.tree) {
      if (leef == 0) {
        continue;
      }
      filters[vv.storage.tree[leef][0]] = vv.storage.tree[leef][1];
    }
    selected_library = vv.songs.filter(selected_library, filters);
    selected_library = vv.songs.uniq(selected_library, key);
    return {
      "key": key,
      "songs": selected_library,
      "style": style,
      "isdir": isdir
    };
  };
  var list_root = function() {
    var ret = [];
    var rootname = "";
    for (rootname in TREE) {
      ret.push({"root": [rootname]});
    }
    return {"key": "root", "songs": ret, "style": "plain", "isdir": true};
  };
  pub.parent = function() {
    var v = pub.list().songs;
    var root = pub.rootname();
    if (root == "root") {
      return;
    }
    if (vv.storage.tree.length > 1) {
      var key = TREE[root]["tree"][vv.storage.tree.length - 2][0];
      var style = TREE[root]["tree"][vv.storage.tree.length - 2][1];
      return {"key": key, "song": v[0], "style": style, "isdir": true};
    }
    return {
      "key": "top",
      "song": {"top": [root]},
      "style": "plain",
      "isdir": true
    };
  };
  pub.grandparent = function() {
    var v = pub.list().songs;
    var root = pub.rootname();
    if (root == "root") {
      return;
    }
    if (vv.storage.tree.length > 2) {
      var key = TREE[root]["tree"][vv.storage.tree.length - 3][0];
      var style = TREE[root]["tree"][vv.storage.tree.length - 3][1];
      return {"key": key, "song": v[0], "style": style, "isdir": true};
    } else if (vv.storage.tree.length == 2) {
      return {
        "key": "top",
        "song": {"top": [root]},
        "style": "plain",
        "isdir": true
      };
    }
    return {
      "key": "root",
      "song": {"root": ["Library"]},
      "style": "plain",
      "isdir": true
    };
  };
  return pub;
}());
vv.control = (function() {
  var pub = {};
  var listener = {};
  pub.addEventListener = function(ev, func) {
    if (listener[ev] == null) {
      listener[ev] = [];
    }
    listener[ev].push(func);
  };
  pub.removeEventListener = function(ev, func) {
    for (var i in listener[ev]) {
      if (listener[ev][i] == func) {
        listener[ev].splice(i, 1);
        return;
      }
    }
  };
  pub.raiseEvent = function(ev) {
    var i;
    for (i in listener[ev]) {
      listener[ev][i]();
    }
  };

  pub.swipe = function(element, f) {
    element.swipe_target = f;
    var starttime = 0;
    var now = 0;
    var start = function(e) {
      if (e.buttons && e.buttons != 1) {
        return;
      }
      if (e.touches) {
        e.currentTarget.x = e.touches[0].screenX;
        e.currentTarget.y = e.touches[0].screenY;
      } else {
        e.currentTarget.x = e.screenX;
        e.currentTarget.y = e.screenY;
      }
      if (e.currentTarget.x > 40) {
        return;
      }
      starttime = (new Date()).getTime();
      e.currentTarget.swipe = true;
      e.currentTarget.classList.add("swipe");
    };
    var move = function(e) {
      if (e.buttons && e.buttons != 1) {
        return;
      }
      if (!e.currentTarget.swipe) {
        return;
      }
      if (e.touches) {
        e.currentTarget.diff_x = e.currentTarget.x - e.touches[0].screenX;
        e.currentTarget.diff_y = e.currentTarget.y - e.touches[0].screenY;
      } else {
        e.currentTarget.diff_x = e.currentTarget.x - e.screenX;
        e.currentTarget.diff_y = e.currentTarget.y - e.screenY;
      }
      now = (new Date()).getTime();
      e.currentTarget.diff_x_l = e.currentTarget.diff_x > 0 ?
          e.currentTarget.diff_x :
          e.currentTarget.diff_x * -1;
      e.currentTarget.diff_y_l = e.currentTarget.diff_y > 0 ?
          e.currentTarget.diff_y :
          e.currentTarget.diff_y * -1;
      if (now - starttime < 200 &&
          e.currentTarget.diff_y_l > e.currentTarget.diff_x_l) {
        e.currentTarget.swipe = false;
        e.currentTarget.classList.remove("swipe");
        e.currentTarget.style.transform = "translate3d(0,0,0)";
      } else {
        e.currentTarget.style.transform =
            "translate3d(" + e.currentTarget.diff_x * -1 + "px,0,0)";
      }

    };
    var end = function(e) {
      if (e.buttons && e.buttons != 1) {
        return;
      }
      if (!e.currentTarget.swipe) {
        return;
      }
      var p = e.currentTarget.clientWidth / e.currentTarget.diff_x;
      if (p > -4 && p < 0) {
        f(e);
      } else if (
          now - starttime < 200 &&
          e.currentTarget.diff_y_l < e.currentTarget.diff_x_l &&
          e.currentTarget.diff_x < 0) {
        f(e);
      }
      e.currentTarget.swipe = false;
      e.currentTarget.classList.remove("swipe");
      e.currentTarget.style.transform = "translate3d(0,0,0)";
    };
    if ("ontouchend" in element) {
      element.addEventListener("touchstart", start);
      element.addEventListener("touchmove", move);
      element.addEventListener("touchend", end);
    } else {
      element.addEventListener("mousedown", start);
      element.addEventListener("mousemove", move);
      element.addEventListener("mouseup", end);
    }
  };

  pub.click = function(element, f) {
    element.click_target = f;
    var enter = function(e) { e.currentTarget.classList.add("hover"); };
    var leave = function(e) { e.currentTarget.classList.remove("hover"); };
    var start = function(e) {
      if (e.buttons && e.buttons != 1) {
        return;
      }
      if (e.touches) {
        e.currentTarget.x = e.touches[0].screenX;
        e.currentTarget.y = e.touches[0].screenY;
      } else {
        e.currentTarget.x = e.screenX;
        e.currentTarget.y = e.screenY;
      }
      e.currentTarget.touch = true;
      e.currentTarget.classList.add("active");
    };
    var move = function(e) {
      if (e.buttons && e.buttons != 1) {
        return;
      }
      if (!e.currentTarget.touch) {
        return;
      }
      var change = false;
      var diff;
      if (e.touches) {
        diff = e.currentTarget.x - e.touches[0].screenX;
        change = -5 > diff || diff > 5;
        if (!change) {
          diff = e.currentTarget.y - e.touches[0].screenY;
          change = -5 > diff || diff > 5;
        }
      } else {
        diff = e.currentTarget.x - e.screenX;
        change = -5 > diff || diff > 5;
        if (!change) {
          diff = e.currentTarget.y - e.screenY;
          change = -5 > diff || diff > 5;
        }
      }
      if (change) {
        e.currentTarget.touch = false;
        e.currentTarget.classList.remove("active");
      }
    };
    var end = function(e) {
      if (e.buttons && e.buttons != 1) {
        return;
      }
      e.currentTarget.classList.remove("active");
      if (e.currentTarget.touch) {
        f(e);
      }
    };
    if ("ontouchend" in element) {
      element.addEventListener("touchstart", start);
      element.addEventListener("touchmove", move);
      element.addEventListener("touchend", end);
    } else {
      element.addEventListener("mousedown", start);
      element.addEventListener("mousemove", move);
      element.addEventListener("mouseup", end);
      element.addEventListener("mouseenter", enter);
      element.addEventListener("mouseleave", leave);
    }
  };

  var requests = {};
  var abort_all_requests = function() {
    for (var i in requests) {
      requests[i].abort();
    }
  };
  var get_request = function(path, ifmodified, callback, timeout) {
    var key = "GET " + path;
    var xhr;
    if (!requests[key]) {
      xhr = new XMLHttpRequest();
      requests[key] = xhr;
    } else {
      xhr = requests[key];
      xhr.onabort = function() {};  // disable retry
      xhr.abort();
    }
    if (!timeout) {
      timeout = 1000;
    }
    xhr.timeout = timeout;
    xhr.onload = function() {
      if (xhr.status == 200 || xhr.status == 304) {
        if (xhr.status == 200 && callback) {
          callback(
              JSON.parse(xhr.responseText),
              xhr.getResponseHeader("Last-Modified"));
        }
        return;
      }
      // error handling
      if (xhr.status != 0) {
        vv.view.popup.show("GET " + path, xhr.statusText);
      }
    };
    xhr.onabort = function() {
      if (timeout < 50000) {
        vv.view.popup.show("GET " + path, "Abort. Retrying...");
        setTimeout(function() {
          get_request(path, ifmodified, callback, timeout * 2);
        });
      } else {
        vv.view.popup.show("GET " + path, "Abort");
      }
    };
    xhr.onerror = function() { vv.view.popup.show("GET " + path, "Error"); };
    xhr.ontimeout = function() {
      if (timeout < 50000) {
        vv.view.popup.show("GET " + path, "Timeout. Retrying...");
        abort_all_requests();
        setTimeout(function() {
          get_request(path, ifmodified, callback, timeout * 2);
        });
      } else {
        vv.view.popup.show("GET " + path, "Timeout");
      }
    };
    xhr.open("GET", path, true);
    xhr.setRequestHeader("If-Modified-Since", ifmodified);
    xhr.send();
  };

  var post_request = function(path, obj) {
    var key = "POST " + path;
    var xhr;
    if (!requests[key]) {
      xhr = new XMLHttpRequest();
      requests[key] = xhr;
    } else {
      xhr = requests[key];
      xhr.abort();
    }
    xhr.timeout = 1000;
    xhr.onload = function() {
      if (xhr.status == 404) {
        vv.view.popup.show("POST " + path, "Not Found");
      } else if (xhr.status != 200) {
        vv.view.popup.show("POST " + path, JSON.parse(xhr.responseText).error);
      }
    };
    xhr.ontimeout = function() {
      vv.view.popup.show("POST " + path, "Timeout");
      abort_all_requests();
    };
    xhr.onerror = function() { vv.view.popup.show("POST " + path, "Error"); };
    xhr.open("POST", path, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(obj));
  };

  var fetch = function(target, store) {
    get_request(
        target, vv.obj.getOrElse(vv.storage.last_modified, store, ""),
        function(ret, modified) {
          if (!ret.error) {
            vv.storage[store] = ret.data;
            vv.storage.last_modified_ms[store] = Date.parse(modified);
            vv.storage.last_modified[store] = modified;
            if (store == "library") {
              vv.storage.save_library();
            }
            pub.raiseEvent(store);
          }
        });
  };

  pub.rescan_library = function() {
    post_request("/api/music/library", {"action": "rescan"});
    vv.storage.control.update_library = true;
    pub.raiseEvent("control");
  };

  pub.prev = function() {
    post_request("/api/music/control", {"state": "prev"});
  };

  pub.play_pause = function() {
    var state = vv.obj.getOrElse(vv.storage.control, "state", "stopped");
    var action = state == "play" ? "pause" : "play";
    post_request("/api/music/control", {"state": action});
    vv.storage.control.state = action;
    pub.raiseEvent("control");
  };

  pub.next = function() {
    post_request("/api/music/control", {"state": "next"});
  };

  pub.toggle_repeat = function() {
    post_request(
        "/api/music/control", {"repeat": !vv.storage.control["repeat"]});
    vv.storage.control.repeat = !vv.storage.control.repeat;
    pub.raiseEvent("control");
  };

  pub.toggle_random = function() {
    post_request(
        "/api/music/control", {"random": !vv.storage.control["random"]});
    vv.storage.control.random = !vv.storage.control.random;
    pub.raiseEvent("control");
  };

  pub.play = function(pos) {
    post_request("/api/music/songs/sort", {
      "keys": vv.model.list.sortkeys(),
      "filters": vv.model.list.filters(pos),
      "play": pos
    });
  };

  pub.volume = function(num) {
    post_request("/api/music/control", {"volume": num});
  };

  pub.output = function(id, on) {
    post_request("/api/music/outputs/" + id, {"outputenabled": on});
  };

  var notify_last_update = (new Date()).getTime();
  var notify_last_connection = (new Date()).getTime();
  var connected = false;
  var notify_err_cnt = 0;
  var listennotify = function() {
    if (notify_err_cnt > 20) {
      vv.view.popup.show("WebSocket", "Stopped. Too many errors.");
      return;
    }
    notify_last_connection = (new Date()).getTime();
    connected = false;
    var uri = "ws://" + location.host + "/api/music/notify";
    if (ws != null) {
      ws.onclose = function() {};
      ws.close();
    }
    var ws = new WebSocket(uri);
    ws.onopen = function() {
      if (notify_err_cnt > 0) {
        vv.view.popup.show("WebSocket", "Connected");
      }
      connected = true;
      notify_last_update = (new Date()).getTime();
      update_all();
    };
    ws.onmessage = function(e) {
      if (e && e.data) {
        if (e.data == "library") {
          fetch("/api/music/library", "library");
        } else if (e.data == "status") {
          fetch("/api/music/control", "control");
        } else if (e.data == "current") {
          fetch("/api/music/songs/current", "current");
        } else if (e.data == "outputs") {
          fetch("/api/music/outputs", "outputs");
        } else if (e.data == "stats") {
          fetch("/api/music/stats", "stats");
        } else if (e.data == "playlist") {
          fetch("/api/music/songs/sort", "sorted");
        }
        var new_notify_last_update = (new Date()).getTime();
        if (new_notify_last_update - notify_last_update > 10000) {
          // recover lost notification
          setTimeout(listennotify);
        }
        notify_last_update = new_notify_last_update;
        notify_err_cnt = 0;
      }
    };
    ws.onclose = function() {
      if (notify_err_cnt > 0) {
        vv.view.popup.show("WebSocket", "Socket is closed. Reconnecting");
      }
      notify_last_update = (new Date()).getTime();
      notify_err_cnt++;
      setTimeout(listennotify, 1000);
    };
  };

  var update_all = function() {
    fetch("/api/music/songs/sort", "sorted");
    fetch("/api/version", "version");
    fetch("/api/music/outputs", "outputs");
    fetch("/api/music/songs/current", "current");
    fetch("/api/music/control", "control");
    fetch("/api/music/library", "library");
  };

  var init = function() {
    var polling = function() {
      var now = (new Date()).getTime();
      if (connected && now - 10000 > notify_last_update) {
        notify_err_cnt++;
        vv.view.popup.show(
            "WebSocket", "Socket does not respond properly. Reconnecting");
        setTimeout(listennotify);
      }
      if (!connected && now - 2000 > notify_last_connection) {
        notify_err_cnt++;
        vv.view.popup.show("WebSocket", "Connection timed out. Reconnecting");
        setTimeout(listennotify);
      }

      pub.raiseEvent("poll");
      setTimeout(polling, 1000);
    };
    var show = {
      "main": vv.view.main.show,
      "list": vv.view.list.show,
      "system": vv.view.system.show
    };
    show[vv.storage.last_state]();
    pub.raiseEvent("start");
    if (vv.storage.current && vv.storage.last_modified.current) {
      pub.raiseEvent("current");
    }
    listennotify();
    polling();
  };

  pub.start = function() {
    if (document.readyState !== "loading") {
      init();
    } else {
      document.addEventListener("DOMContentLoaded", init);
    }
  };

  var focus = function() {
    vv.storage.save();
    if (vv.storage.preferences.playback.view_follow &&
        vv.storage.current.file) {
      vv.model.list.abs(vv.storage.current);
    }
  };
  var focusremove = function(key, remove) {
    var n = function() {
      focus();
      remove(key, n);
    };
    return n;
  };
  pub.addEventListener("current", focus);
  vv.model.list.addEventListener(
      "update", focusremove("update", vv.model.list.removeEventListener));
  pub.addEventListener("sorted", focusremove("sorted", removeEventListener));
  pub.addEventListener(
      "library", function() { vv.model.list.update(vv.storage.library); });
  pub.addEventListener("start", function() {
    if (vv.storage.library.length) {
      vv.model.list.update(vv.storage.library);
    }
  });

  return pub;
}());

// background
(function() {
  var color = 128;
  var calc_color = function(path) {
    var canvas = document.createElement("canvas").getContext("2d");
    var img = new Image();
    img.onload = function() {
      canvas.drawImage(img, 0, 0, 5, 5);
      try {
        var d = canvas.getImageData(0, 0, 5, 5).data;
        var i = 0;
        var newcolor = 0;
        for (i = 0; i < d.length; i++) {
          newcolor += d[i];
        }
        color = newcolor / d.length;
        update_theme();
      } catch (e) {
        // failed to getImageData
      }
    };
    img.src = path;
  };
  var update = function() {
    var e = document.getElementById("background-image");
    if (vv.storage.preferences.appearance.background_image) {
      e.classList.remove("hide");
      document.getElementById("background-image").classList.remove("hide");
      var cover = "/assets/nocover.svg";
      if (vv.storage.current && vv.storage.current.cover) {
        cover = "/music_directory/" + vv.storage.current.cover;
      }
      var newimage = "url(\"" + cover + "\")";
      if (e.style.backgroundImage != newimage) {
        calc_color(cover);
        e.style.backgroundImage = newimage;
      }
      e.style.filter = "blur(" +
          vv.storage.preferences.appearance.background_image_blur + "px)";
    } else {
      e.classList.add("hide");
      document.getElementById("background-image").classList.add("hide");
    }
  };
  var update_theme = function() {
    if (color < vv.storage.preferences.appearance.color_threshold) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  };
  vv.control.addEventListener("current", update);
  vv.control.addEventListener("preferences", update);
  vv.control.addEventListener("preferences", update_theme);
  vv.control.addEventListener("start", update);
}());

vv.view.main = (function() {
  var pub = {};
  var load_volume_preferences = function() {
    var c = document.getElementById("control-volume");
    c.max = vv.storage.preferences["volume"]["max"];
    if (vv.storage.preferences["volume"]["show"]) {
      c.classList.remove("hide");
    } else {
      c.classList.add("hide");
    }
  };
  vv.control.addEventListener("control", function() {
    var c = document.getElementById("control-volume");
    c.value = vv.storage.control.volume;
    if (vv.storage.control.volume < 0) {
      c.classList.add("disabled");
    } else {
      c.classList.remove("disabled");
    }
  });
  vv.control.addEventListener("preferences", load_volume_preferences);
  pub.show = function() {
    vv.storage.last_state = "main";
    vv.storage.save();
    document.body.classList.add("view-main");
    document.body.classList.remove("view-system");
    document.body.classList.remove("view-list");
  };
  pub.hidden = function() {
    var e = document.body;
    if (window.matchMedia("(orientation: portrait)").matches) {
      return !e.classList.contains("view-main");
    } else {
      return !(
          e.classList.contains("view-list") ||
          e.classList.contains("view-main"));
    }
  };
  pub.update = function() {
    document.getElementById("main-box-title").textContent =
        vv.storage.current["Title"];
    document.getElementById("main-box-artist").textContent =
        vv.storage.current["Artist"];
    if (vv.storage.current.cover) {
      document.getElementById("main-cover-img").style.backgroundImage =
          "url(\"/music_directory/" + vv.storage.current["cover"] + "\")";
    } else {
      document.getElementById("main-cover-img").style.backgroundImage = "";
    }
  };
  var update_style = function() {
    var e = document.getElementById("main-cover");
    if (vv.storage.preferences.appearance.circled_image) {
      e.classList.add("circled");
    } else {
      e.classList.remove("circled");
    }
    if (vv.storage.preferences.appearance.auto_hide_scrollbar !=
        document.body.classList.contains("auto-hide-scrollbar")) {
      if (vv.storage.preferences.appearance.auto_hide_scrollbar) {
        document.body.classList.add("auto-hide-scrollbar");
      } else {
        document.body.classList.remove("auto-hide-scrollbar");
      }
    }
  };
  vv.control.addEventListener("preferences", update_style);
  var update_elapsed = function() {
    if (pub.hidden() ||
        document.getElementById("main-cover-circle")
            .classList.contains("hide")) {
      return;
    }
    var c = document.getElementById("main-cover-circle-active");
    var elapsed = parseInt(vv.storage.control["song_elapsed"] * 1000);
    if (vv.storage.control["state"] == "play") {
      elapsed += (new Date()).getTime() - vv.storage.last_modified_ms.control;
    }
    var total = parseInt(vv.storage.current["Time"]);
    var d = (elapsed * 360 / 1000 / total - 90) * (Math.PI / 180);
    if (isNaN(d)) {
      return;
    }
    var x = 100 + 90 * Math.cos(d);
    var y = 100 + 90 * Math.sin(d);
    if (x <= 100) {
      c.setAttribute(
          "d",
          "M 100,10 L 100,10 A 90,90 0 0,1 100,190 L 100,190 A 90,90 0 0,1 " +
              x + "," + y);
    } else {
      c.setAttribute("d", "M 100,10 L 100,10 A 90,90 0 0,1 " + x + "," + y);
    }
  };
  var init = function() {
    document.getElementById("control-volume")
        .addEventListener(
            "change", function() { vv.control.volume(parseInt(this.value)); });
    vv.control.click(document.getElementById("main-cover"), function() {
      if (vv.storage.current) {
        vv.view.modal.song.show(vv.storage.current);
      }
    });
    load_volume_preferences();
    update_style();
    vv.control.swipe(document.getElementById("main"), function() {
      vv.model.list.abs(vv.storage.current);
      vv.view.list.show();
    });
  };
  vv.control.addEventListener("current", pub.update);
  vv.control.addEventListener("poll", update_elapsed);
  vv.control.addEventListener("start", init);
  return pub;
}());
vv.view.list = (function() {
  var pub = {};
  pub.show = function() {
    vv.storage.last_state = "list";
    vv.storage.save();
    document.body.classList.add("view-list");
    document.body.classList.remove("view-main");
    document.body.classList.remove("view-system");
  };
  pub.hidden = function() {
    var e = document.body;
    if (window.matchMedia("(orientation: portrait)").matches) {
      return !e.classList.contains("view-list");
    } else {
      return !(
          e.classList.contains("view-list") ||
          e.classList.contains("view-main"));
    }
  };
  pub.update = function() {
    if (vv.storage.tree.length % 2 == 0) {
      document.getElementById("list").classList.remove("odd");
      document.getElementById("list").classList.add("even");
    } else {
      document.getElementById("list").classList.remove("even");
      document.getElementById("list").classList.add("odd");
    }
    var ls = vv.model.list.list();
    var key = ls.key;
    var songs = ls.songs;
    var isdir = ls.isdir;
    var style = ls.style;
    var newul = document.createDocumentFragment();
    var ul = document.getElementById("list-items");
    var scroll = document.getElementById("list");
    while (ul.lastChild) {
      ul.removeChild(ul.lastChild);
    }
    var li;
    var i;
    var focus_li = null;
    ul.classList.remove("songlist");
    ul.classList.remove("albumlist");
    ul.classList.remove("plainlist");
    ul.classList.add(style + "list");
    for (i in songs) {
      if (i == 0 && vv.model.list.rootname() != "root") {
        li = document.createElement("li");
        var p = vv.model.list.parent();
        li = vv.song.element(li, p.song, p.key, p.style);
        li.classList.add("list-header");
        newul.appendChild(li);
      }
      li = document.createElement("li");
      li = vv.song.element(li, songs[i], key, style);
      li.classList.add("selectable");
      // do not select root items.
      // all root items have same song.
      if (vv.model.list.rootname() != "root" && songs[i] &&
          vv.model.list.focused() &&
          songs[i].file == vv.model.list.focused().file) {
        focus_li = li;
        focus_li.classList.add("selected");
      }
      vv.control.click(li, function(e) {
        if (e.currentTarget.classList.contains("playing")) {
          vv.model.list.abs(vv.storage.current);
          vv.view.main.show();
          return;
        }
        var value = e.currentTarget.getAttribute("key");
        var pos = e.currentTarget.getAttribute("pos");
        if (isdir) {
          vv.model.list.down(value);
        } else {
          vv.control.play(parseInt(pos));
        }
      }, false);
      newul.appendChild(li);
    }
    preferences_update();
    ul.appendChild(newul);
    if (focus_li) {
      var pos = focus_li.offsetTop;
      var t = scroll.scrollTop;
      if (t < pos && pos < t + scroll.clientHeight) {
        return;
      }
      scroll.scrollTop = pos;
    } else {
      scroll.scrollTop = 0;
    }
  };
  var preferences_update = function() {
    var ul = document.getElementById("list-items");
    if (vv.storage.preferences.appearance.gridview_album) {
      ul.classList.add("grid");
      ul.classList.remove("nogrid");
    } else {
      ul.classList.add("nogrid");
      ul.classList.remove("grid");
    }
  };
  pub.up = function() { select_focused_or("up"); };
  pub.left = function() { select_focused_or("left"); };
  pub.right = function() { select_focused_or("right"); };
  pub.down = function() { select_focused_or("down"); };
  var select_focused_or = function(target) {
    var style = vv.model.list.list().style;
    var scroll = document.getElementById("list");
    var l = document.getElementById("list-items");
    var itemcount = parseInt(scroll.clientWidth / 160);
    if (!vv.storage.preferences.appearance.gridview_album) {
      itemcount = 1;
    }
    var t = scroll.scrollTop;
    var h = scroll.clientHeight;
    var s = l.getElementsByClassName("selected");
    var f = l.getElementsByClassName("playing");
    var p = 0;
    var c = null;
    var n = null;
    var i = 0;
    if (s.length == 0 && f.length == 1) {
      p = f[0].offsetTop;
      if (t < p && p < t + h) {
        f[0].classList.add("selected");
        return;
      }
    }
    if (s.length > 0) {
      p = s[0].offsetTop;
      if (p < t || t + h < p + s[0].offsetHeight) {
        select_near_item();
        return;
      }
    }
    if (s.length == 0 && f.length == 0) {
      select_near_item();
      return;
    }
    if (s.length > 0) {
      var selectable = l.getElementsByClassName("selectable");
      if (target == "up" && selectable[0] == s[0]) {
        return;
      }
      if (target == "down" && selectable[selectable.length - 1] == s[0]) {
        return;
      }
      for (i = 0; i < selectable.length; i++) {
        c = selectable[i];
        if (c == s[0]) {
          if ((i > 0 && target == "up" && style != "album") ||
              (i > 0 && target == "left")) {
            n = selectable[i - 1];
            c.classList.remove("selected");
            n.classList.add("selected");
            p = n.offsetTop;
            if (p < t) {
              scroll.scrollTop = p;
            }
            return;
          }
          if (i > itemcount - 1 && target == "up" && style == "album") {
            n = selectable[i - itemcount];
            c.classList.remove("selected");
            n.classList.add("selected");
            p = n.offsetTop;
            if (p < t) {
              scroll.scrollTop = p;
            }
            return;
          }
          if ((i != (selectable.length - 1) && target == "down" &&
               style != "album") ||
              (i != (selectable.length - 1) && target == "right")) {
            n = selectable[i + 1];
            c.classList.remove("selected");
            n.classList.add("selected");
            p = n.offsetTop + n.offsetHeight;
            if (t + h < p) {
              scroll.scrollTop = p - h;
            }
            return;
          }
          if ((i < (selectable.length - 1) && target == "down" &&
               style == "album") ||
              (i != (selectable.length - 1) && target == "right")) {
            if (i + itemcount >= selectable.length) {
              n = selectable[selectable.length - 1];
            } else {
              n = selectable[i + itemcount];
            }
            c.classList.remove("selected");
            n.classList.add("selected");
            p = n.offsetTop + n.offsetHeight;
            if (t + h < p) {
              scroll.scrollTop = p - h;
            }
            return;
          }
        }
      }
    }
  };

  var select_near_item = function() {
    var scroll = document.getElementById("list");
    var l = document.getElementById("list-items");
    var selectable = l.getElementsByClassName("selectable");
    var updated = false;
    for (var i = 0; i < selectable.length; i++) {
      var c = selectable[i];
      var p = c.offsetTop;
      if (scroll.scrollTop < p && p < scroll.scrollTop + scroll.clientHeight &&
          !updated) {
        c.classList.add("selected");
        updated = true;
      } else {
        c.classList.remove("selected");
      }
    }
  };

  pub.activate = function() {
    var es = document.getElementById("list-items")
                 .getElementsByClassName("selected");
    if (es.length != 0) {
      var e = {};
      e.currentTarget = es[0];
      es[0].click_target(e);
      return true;
    }
    return false;
  };

  vv.control.addEventListener("current", pub.update);
  vv.control.addEventListener("preferences", preferences_update);
  vv.model.list.addEventListener("update", pub.update);
  vv.model.list.addEventListener("changed", pub.update);
  vv.control.addEventListener("start", function() {
    vv.control.swipe(document.getElementById("list"), vv.model.list.up);
  });
  return pub;
}());
vv.view.system = (function() {
  var pub = {};
  var mkshow = function(p, e) {
    return function() {
      document.getElementById(p).classList.add("on");
      document.getElementById(e).classList.add("on");
    };
  };
  var mkhide = function(p, e) {
    return function() {
      document.getElementById(p).classList.remove("on");
      document.getElementById(e).classList.remove("on");
    };
  };
  var preferences = (function() {
    vv.control.addEventListener("start", function() {
      var update_animation = function() {
        if (vv.storage.preferences.appearance.animation) {
          document.body.classList.add("animation");
        } else {
          document.body.classList.remove("animation");
        }
      };
      vv.control.addEventListener("preferences", update_animation);
      update_animation();
      var initconfig = function(id) {
        var obj = document.getElementById(id);
        var s = id.indexOf("-");
        var mainkey = id.slice(0, s);
        var subkey = id.slice(s + 1).replace(/-/g, "_");
        var getter = null;
        if (obj.type == "checkbox") {
          obj.checked = vv.storage.preferences[mainkey][subkey];
          getter = function() { return obj.checked; };
        } else if (obj.tagName.toLowerCase() == "select") {
          obj.value = String(vv.storage.preferences[mainkey][subkey]);
          getter = function() { return obj.value; };
        } else if (obj.type == "range") {
          obj.value = String(vv.storage.preferences[mainkey][subkey]);
          getter = function() { return parseInt(obj.value); };
          obj.addEventListener("input", function() {
            vv.storage.preferences[mainkey][subkey] = obj.value;
            vv.control.raiseEvent("preferences");
          });
        }
        obj.addEventListener("change", function() {
          vv.storage.preferences[mainkey][subkey] = getter();
          vv.storage.save();
          vv.control.raiseEvent("preferences");
        });
      };

      // Presto Opera
      if (navigator.userAgent.indexOf("Presto/2") > 1) {
        document.getElementById("config-appearance-animation")
            .classList.add("hide");
      }
      // Mobile
      if (navigator.userAgent.indexOf("Mobile") > 1) {
        document.getElementById("config-appearance-auto-hide-scrollbar")
            .classList.add("hide");
      }

      vv.control.addEventListener("control", function() {
        if (vv.storage.control.volume < 0) {
          document.getElementById("volume-header").classList.add("hide");
          document.getElementById("volume-all").classList.add("hide");
        } else {
          document.getElementById("volume-header").classList.remove("hide");
          document.getElementById("volume-all").classList.remove("hide");
        }
      });

      initconfig("appearance-color-threshold");
      initconfig("appearance-animation");
      initconfig("appearance-background-image");
      initconfig("appearance-background-image-blur");
      initconfig("appearance-circled-image");
      initconfig("appearance-gridview-album");
      initconfig("appearance-auto-hide-scrollbar");
      initconfig("playback-view-follow");
      initconfig("volume-show");
      initconfig("volume-max");
      var rescan = document.getElementById("library-rescan");
      vv.control.click(rescan, function() { vv.control.rescan_library(); });
    });
    var update_devices = function() {
      var ul = document.getElementById("devices");
      while (ul.lastChild) {
        ul.removeChild(ul.lastChild);
      }
      var i;
      for (i in vv.storage.outputs) {
        var o = vv.storage.outputs[i];
        var li = document.createElement("li");
        li.classList.add("note-line");
        li.classList.add("system-setting");
        var desc = document.createElement("div");
        desc.classList.add("system-setting-desc");
        desc.textContent = o["outputname"];
        var ch = document.createElement("input");
        ch.classList.add("slideswitch");
        ch.setAttribute("type", "checkbox");
        ch.setAttribute("id", "device_" + o["outputname"]);
        ch.setAttribute("deviceid", o["outputid"]);
        ch.checked = o["outputenabled"] == "1";
        ch.addEventListener("change", function() {
          vv.control.output(
              parseInt(this.getAttribute("deviceid")), this.checked);
        });
        li.appendChild(desc);
        li.appendChild(ch);
        ul.appendChild(li);
      }
    };
    vv.control.addEventListener("outputs", update_devices);
    vv.control.addEventListener("control", function() {
      var e = document.getElementById("library-rescan");
      if (vv.storage.control.update_library && !e.disabled) {
        e.disabled = true;
        e.textContent = "Rescanning";
      } else if (!vv.storage.control.update_library && e.disabled) {
        e.disabled = false;
        e.textContent = "Rescan";
      }
    });
    return {
      "show": mkshow("system-preferences", "system-nav-preferences"),
      "hide": mkhide("system-preferences", "system-nav-preferences"),
    };
  })();
  var stats = (function() {
    var zfill2 = function(i) { return ("00" + i).slice(-2); };
    var strtimedelta = function(i) {
      var ud = parseInt(i / (24 * 60 * 60));
      var uds = "";
      if (ud == 1) {
        uds = "1 day, ";
      } else if (ud != 0) {
        uds = ud + " days, ";
      }
      var uh = parseInt((i - ud * 24 * 60 * 60) / (60 * 60));
      var um = parseInt((i - ud * 24 * 60 * 60 - uh * 60 * 60) / 60);
      var us = parseInt(i - ud * 24 * 60 * 60 - uh * 60 * 60 - um * 60);
      return uds + zfill2(uh) + ":" + zfill2(um) + ":" + zfill2(us);
    };

    var update = function() {
      document.getElementById("stat-albums").textContent =
          vv.storage.stats.albums;
      document.getElementById("stat-artists").textContent =
          vv.storage.stats.artists;
      document.getElementById("stat-db-playtime").textContent =
          strtimedelta(parseInt(vv.storage.stats.db_playtime));
      document.getElementById("stat-playtime").textContent =
          strtimedelta(parseInt(vv.storage.stats.playtime));
      document.getElementById("stat-tracks").textContent =
          vv.storage.stats.songs;
      var db_update = new Date(parseInt(vv.storage.stats.db_update) * 1000);
      var db_update_yyyymmdd = db_update.getFullYear() * 1000 +
          db_update.getMonth() * 100 + db_update.getDay;
      var db_update_str = "";
      var now = new Date();
      var now_yyyymmdd =
          now.getFullYear() * 1000 + now.getMonth() * 100 + now.getDate;
      if (db_update_yyyymmdd == now_yyyymmdd) {
        db_update_str += "today, ";
      } else if (db_update_yyyymmdd + 1 == now_yyyymmdd) {
        db_update_str += "yesterday, ";
      } else {
        db_update_str += db_update.getFullYear() + "." + db_update.getMonth() +
            "." + db_update.getDate() + " ";
      }
      db_update_str += db_update.getHours() + ":" + db_update.getMinutes() +
          ":" + db_update.getSeconds();
      document.getElementById("stat-db-update").textContent = db_update_str;
      document.getElementById("stat-websockets").textContent =
          vv.storage.stats.subscribers;
    };
    var update_time = function() {
      var diff = parseInt(
          ((new Date()).getTime() - vv.storage.last_modified_ms.stats) / 1000);
      var uptime = parseInt(vv.storage.stats.uptime) + diff;
      if (vv.storage.control.state == "play") {
        var playtime = parseInt(vv.storage.stats.playtime) + diff;
        document.getElementById("stat-playtime").textContent =
            strtimedelta(playtime);
      }
      document.getElementById("stat-uptime").textContent = strtimedelta(uptime);
    };
    vv.control.addEventListener("poll", function() {
      if (document.getElementById("system-stats").classList.contains("on")) {
        update_time();
      }
    });
    vv.control.addEventListener("stats", function() {
      if (document.getElementById("system-stats").classList.contains("on")) {
        update();
      }
    });
    var show = mkshow("system-stats", "system-nav-stats");
    var show_update = function() {
      update();
      update_time();
      show();
    };
    return {
      "show": show_update,
      "hide": mkhide("system-stats", "system-nav-stats"),
    };
  })();
  var info = (function() {
    vv.control.addEventListener("version", function() {
      if (vv.storage.version.vv) {
        document.getElementById("version").textContent = vv.storage.version.vv;
        document.getElementById("go-version").textContent =
            vv.storage.version.go;
      }
    });
    return {
      "show": mkshow("system-info", "system-nav-info"),
      "hide": mkhide("system-info", "system-nav-info"),
    };
  })();
  var init = function() {
    preferences.show();
    vv.control.click(
        document.getElementById("system-nav-preferences"), function() {
          stats.hide();
          info.hide();
          preferences.show();
        });
    vv.control.click(document.getElementById("system-nav-stats"), function() {
      preferences.hide();
      info.hide();
      stats.show();
    });
    vv.control.click(document.getElementById("system-nav-info"), function() {
      preferences.hide();
      stats.hide();
      info.show();
    });
    vv.control.click(document.getElementById("system-reload"), function() {
      location.reload();
    });
    document.getElementById("user-agent").textContent = navigator.userAgent;
    vv.control.swipe(document.getElementById("system"), function() {
      vv.model.list.abs(vv.storage.current);
      vv.view.main.show();
    });

  };
  pub.show = function() {
    vv.storage.last_state = "system";
    vv.storage.save();
    document.body.classList.add("view-system");
    document.body.classList.remove("view-list");
    document.body.classList.remove("view-main");
  };
  pub.hidden = function() {
    return !document.body.classList.contains("view-system");
  };
  vv.control.addEventListener("start", init);
  return pub;
}());

// header
(function() {
  var update = function() {
    var e = document.getElementById("header-back-label");
    var b = document.getElementById("header-back");
    var m = document.getElementById("header-main");
    if (vv.model.list.rootname() != "root") {
      b.classList.remove("root");
      m.classList.remove("root");
      var songs = vv.model.list.list()["songs"];
      if (songs[0]) {
        var p = vv.model.list.grandparent();
        e.textContent = vv.song.getOne(p.song, p.key);
      }
    } else {
      b.classList.add("root");
      m.classList.add("root");
    }
  };
  vv.control.addEventListener("start", function() {
    vv.control.click(document.getElementById("header-back"), function(e) {
      if (!vv.view.list.hidden()) {
        vv.model.list.up();
      } else {
        vv.model.list.abs(vv.storage.current);
      }
      vv.view.list.show();
      e.stopPropagation();
    });
    vv.control.click(document.getElementById("header-main"), function(e) {
      e.stopPropagation();
      if (vv.model.list.rootname() != "root") {
        vv.model.list.abs(vv.storage.current);
      }
      vv.view.main.show();
      e.stopPropagation();
    });
    vv.control.click(document.getElementById("header-system"), function(e) {
      vv.view.system.show();
      e.stopPropagation();
    });
    update();
    vv.model.list.addEventListener("changed", update);
    vv.model.list.addEventListener("update", update);
  });
}());

// footer
(function() {
  vv.control.addEventListener("start", function() {
    vv.control.click(document.getElementById("control-prev"), function(e) {
      vv.control.prev();
      e.stopPropagation();
    });
    vv.control.click(
        document.getElementById("control-toggleplay"), function(e) {
          vv.control.play_pause();
          e.stopPropagation();
        });
    vv.control.click(document.getElementById("control-next"), function(e) {
      vv.control.next();
      e.stopPropagation();
    });
    vv.control.click(document.getElementById("control-repeat"), function(e) {
      vv.control.toggle_repeat();
      e.stopPropagation();
    });
    vv.control.click(document.getElementById("control-random"), function(e) {
      vv.control.toggle_random();
      e.stopPropagation();
    });
  });
  vv.control.addEventListener("control", function() {
    if (vv.storage.control["state"] == "play") {
      document.getElementById("control-toggleplay").classList.add("pause");
      document.getElementById("control-toggleplay").classList.remove("play");
    } else {
      document.getElementById("control-toggleplay").classList.add("play");
      document.getElementById("control-toggleplay").classList.remove("pause");
    }
    if (vv.storage.control["repeat"]) {
      document.getElementById("control-repeat").classList.add("on");
      document.getElementById("control-repeat").classList.remove("off");
    } else {
      document.getElementById("control-repeat").classList.add("off");
      document.getElementById("control-repeat").classList.remove("on");
    }
    if (vv.storage.control["random"]) {
      document.getElementById("control-random").classList.add("on");
      document.getElementById("control-random").classList.remove("off");
    } else {
      document.getElementById("control-random").classList.add("off");
      document.getElementById("control-random").classList.remove("on");
    }
  });
}());

vv.view.popup = (function() {
  var pub = {};
  var data = {};
  pub.exists = function(title) { return title in data; };
  pub.show = function(title, description) {
    var obj = null;
    if (title in data) {
      obj = data[title];
      obj.getElementsByClassName("popup-description")[0].textContent =
          description;
    } else {
      obj = document.createElement("section");
      obj.classList.add("popup");
      var popup_title = document.createElement("h3");
      popup_title.classList.add("popup-title");
      popup_title.textContent = title;
      obj.appendChild(popup_title);
      var popup_description = document.createElement("span");
      popup_description.classList.add("popup-description");
      popup_description.textContent = description;
      obj.appendChild(popup_description);
      data[title] = obj;
      document.getElementById("popup-box").appendChild(obj);
    }
    obj.classList.remove("hide");
    obj.classList.add("show");
    obj.timestamp = (new Date()).getTime();
    setTimeout(function() {
      if ((new Date()).getTime() - obj.timestamp > 4000) {
        obj.classList.remove("show");
        obj.classList.add("hide");
      }
    }, 5000);
  };
  pub.hide = function(title) {
    if (title in data) {
      var e = data[title];
      e.classList.remove("show");
      e.classList.add("hide");
    }
  };
  return pub;
}());

// elapsed circle/time updater
(function() {
  var update = function() {
    var data = vv.storage.control;
    if ("state" in data) {
      var elapsed = parseInt(data["song_elapsed"] * 1000);
      var current = elapsed;
      if (data["state"] == "play") {
        current += (new Date).getTime() - vv.storage.last_modified_ms.control;
      }
      current = parseInt(current / 1000);
      var min = parseInt(current / 60);
      var sec = current % 60;
      var label = min + ":" + ("0" + sec).slice(-2);
      [].forEach.call(document.getElementsByClassName("elapsed"), function(x) {
        if (x.textContent != label) {
          x.textContent = label;
        }
      });
    }
  };
  vv.control.addEventListener("control", update);
  vv.control.addEventListener("poll", update);
}());

vv.view.modal.hide = function() {
  document.getElementById("modal-background").classList.add("hide");
  document.getElementById("modal-outer").classList.add("hide");
  var ws = document.getElementsByClassName("modal-window");
  var i;
  for (i in ws) {
    if (ws[i].classList) {
      ws[i].classList.add("hide");
    }
  }
};
vv.view.modal.help = (function() {
  var pub = {};
  pub.show = function() {
    var b = document.getElementById("modal-background");
    if (!b.classList.contains("hide")) {
      return;
    }
    b.classList.remove("hide");
    document.getElementById("modal-outer").classList.remove("hide");
    document.getElementById("modal-help").classList.remove("hide");
  };
  pub.hide = function() {
    document.getElementById("modal-background").classList.add("hide");
    document.getElementById("modal-outer").classList.add("hide");
    document.getElementById("modal-help").classList.add("hide");
  };
  vv.control.addEventListener("start", function() {
    vv.control.click(document.getElementById("modal-help-close"), pub.hide);
    vv.control.click(
        document.getElementById("modal-outer"), vv.view.modal.hide);
    vv.control.click(
        document.getElementById("modal-background"), vv.view.modal.hide);

    var ws = document.getElementsByClassName("modal-window");
    var i;
    for (i in ws) {
      if (ws[i].addEventListener) {
        vv.control.click(ws[i], function(e) { e.stopPropagation(); });
      }
    }
  });
  return pub;
}());
vv.view.modal.song = (function() {
  var pub = {};
  pub.show = function(song) {
    var table = document.getElementById("modal-window-song-desclist");
    while (table.lastChild) {
      table.removeChild(table.lastChild);
    }
    var newtable = document.createDocumentFragment();
    var mktr = function(song, key) {
      var tr = document.createElement("tr");
      tr.classList.add("modal-window-tableitem");
      var th = document.createElement("th");
      th.classList.add("modal-window-tablekey");
      th.textContent = key;
      tr.appendChild(th);
      var td = document.createElement("td");
      td.classList.add("modal-window-table-value");
      if (Object.prototype.toString.call(song[key]) == "[object Array]") {
        for (var j in song[key]) {
          var childvalue = document.createElement("span");
          childvalue.textContent = song[key][j];
          td.appendChild(childvalue);
        }
      }
      tr.appendChild(td);
      return tr;
    };
    var mustkeys = [
      "Title", "Artist", "Album", "Date", "AlbumArtist", "Genre", "Performer"
    ];
    for (var i in mustkeys) {
      newtable.appendChild(mktr(song, mustkeys[i]));
    }
    for (i in song) {
      if (mustkeys.indexOf(i) == -1) {
        newtable.appendChild(mktr(song, i));
      }
    }
    table.appendChild(newtable);
    document.getElementById("modal-background").classList.remove("hide");
    document.getElementById("modal-outer").classList.remove("hide");
    document.getElementById("modal-song").classList.remove("hide");
  };
  pub.hide = function() {
    document.getElementById("modal-background").classList.add("hide");
    document.getElementById("modal-outer").classList.add("hide");
    document.getElementById("modal-song").classList.add("hide");
  };
  vv.control.addEventListener("start", function() {
    vv.control.click(document.getElementById("modal-song-close"), pub.hide);

    var ws = document.getElementsByClassName("modal-window");
    var i;
    for (i in ws) {
      if (ws[i].addEventListener) {
        vv.control.click(ws[i], function(e) { e.stopPropagation(); });
      }
    }
  });
  return pub;
}());

// keyboard events
(function() {
  vv.control.addEventListener("start", function() {
    document.addEventListener("keydown", function(e) {
      if (!document.getElementById("modal-background")
               .classList.contains("hide")) {
        if (e.key == "Escape" || e.key == "Esc") {
          vv.view.modal.hide();
        }
        return;
      }
      var buble = false;
      var mod = 0;
      mod = mod | e.shiftKey << 3;
      mod = mod | e.altKey << 2;
      mod = mod | e.ctrlKey << 1;
      mod = mod | e.metaKey;
      if (mod == 0 && (e.key == " " || e.key == "Spacebar")) {
        vv.control.play_pause();
        e.stopPropagation();
        e.preventDefault();
      } else if (mod == 10 && e.keyCode == 37) {
        vv.control.prev();
        e.stopPropagation();
        e.preventDefault();
      } else if (mod == 10 && e.keyCode == 39) {
        vv.control.next();
        e.stopPropagation();
        e.preventDefault();
      } else if (mod == 0 && e.keyCode == 13) {
        if (!vv.view.list.hidden() && vv.view.list.activate()) {
          e.stopPropagation();
          e.preventDefault();
        }
      } else if (
          (mod == 0 && e.keyCode == 8) || (mod == 1 && e.keyCode == 37)) {
        if (!vv.view.list.hidden()) {
          vv.model.list.up();
        } else {
          vv.model.list.abs(vv.storage.current);
        }
        vv.view.list.show();
        e.stopPropagation();
        e.preventDefault();
      } else if (mod == 0 && e.keyCode == 37) {
        if (!vv.view.list.hidden()) {
          vv.view.list.left();
          e.stopPropagation();
          e.preventDefault();
        }
      } else if (mod == 0 && e.keyCode == 38) {
        if (!vv.view.list.hidden()) {
          vv.view.list.up();
          e.stopPropagation();
          e.preventDefault();
        }
      } else if (mod == 1 && e.keyCode == 39) {
        if (vv.model.list.rootname() != "root") {
          vv.model.list.abs(vv.storage.current);
        }
        vv.view.main.show();
        e.stopPropagation();
      } else if (mod == 0 && e.keyCode == 39) {
        if (!vv.view.list.hidden()) {
          vv.view.list.right();
          e.stopPropagation();
          e.preventDefault();
        }
      } else if (mod == 0 && e.keyCode == 40) {
        if (!vv.view.list.hidden()) {
          vv.view.list.down();
          e.stopPropagation();
          e.preventDefault();
        }
      } else if ((mod & 7) == 0 && e.key == "?") {
        vv.view.modal.help.show();
      } else {
        buble = true;
      }
      if (!buble) {
        e.stopPropagation();
      }
    });
  });
}());

vv.control.start();
