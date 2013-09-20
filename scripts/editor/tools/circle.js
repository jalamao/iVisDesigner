// iVisDesigner
// Author: Donghao Ren, PKUVIS, Peking University, 2013.04
// See LICENSE.txt for copyright information.

(function() {

Tools.Circle = {
    onActive: function() {
        var $this = this;
        IV.set("status", "Circle: Select the center.");
        Tools.beginSelectLocation(function(loc) {
            var path = Editor.get("selected-path");
            if(path) {
                var circle = new IV.objects.Circle({
                    path: path,
                    center: loc
                });
                Editor.doAddObject(circle);
            }
        }, "tools:Circle");
    },
    onInactive: function() {
        Tools.endSelectLocation("tools:Circle");
    }
};

})();
