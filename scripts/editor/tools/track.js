(function() {

Tools.Track = {
    onActive: function() {
        var $this = this;
        $this.loc1 = null;
        $this.loc2 = null;
        IV.set("status", "Track: Select point A.");
        Tools.beginSelectLocation(function(loc) {
            if(!$this.loc1) {
                $this.loc1 = loc;
                IV.set("status", "Track: Select point B.");
                return;
            } else {
                $this.loc2 = loc;
                var path = IV.get("selected-path");
                if(IV.data.getSchema(path) && IV.data.getSchema(path).type == "number") {
                    var track = new IV.objects.Track(
                        path, $this.loc1, $this.loc2
                    );
                    Editor.doAddObject(track);
                }
                $this.loc1 = null;
                $this.loc2 = null;
                IV.set("status", "Track: Select point A.");
            }
        }, "tools:Track");
    },
    onInactive: function() {
        Tools.endSelectLocation("tools:Track");
    }
};

})();

(function() {

Tools.Scatter = {
    onActive: function() {
        var obj1 = null;
        var obj2 = null;
        IV.vis.clearSelection();
        Tools.triggerRender("main,back");

        IV.set("status", "Scatter: Select track A.");

        Tools.beginSelectObject(function(context) {
            var path = IV.get("selected-path");
            if(!context) {
                obj1 = null;
                obj2 = null;
                IV.vis.clearSelection();
                IV.raise("vis:objects:selection");
                Tools.triggerRender("main,back");
                IV.set("status", "Scatter: Select track A.");
                return;
            }
            if(!obj1) {
                obj1 = context.obj;
                IV.vis.appendSelection(context);
                IV.raise("vis:objects:selection");
                Tools.triggerRender("main,back");
                IV.set("status", "Scatter: Select track B.");
            } else if(!obj2) {
                obj2 = context.obj;
                if(IV.data.getSchema(path)) {
                    if(obj1.type == "Track" && obj2.type == "Track") {
                        var scatter = new IV.objects.Scatter(obj1, obj2);
                        Editor.doAddObject(scatter);
                    }
                }
                obj1 = null;
                obj2 = null;
                IV.vis.clearSelection();
                IV.raise("vis:objects:selection");
                Tools.triggerRender("main,back");
                IV.set("status", "Scatter: Select track A.");
            }
        }, "tools:Line");
    },
    onInactive: function() {
        Tools.endSelectObject("tools:Line");
    }
};

})();
