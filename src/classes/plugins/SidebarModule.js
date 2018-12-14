export class SidebarModule {
    constructor(name) {
        super();

        this.name = name;
        this._destroyed = false;

        this._setupListeners();

        OHIF.plugins.sidebar.push(this);
    }

    setup(div) {
        OHIF.log.info(`Setup for plugin: ${this.name}`);
    }

    /**
     * Listen for changes to the sidebar settings which would necessitate a
     * rerendering of the sidebar. When this happens, re-render the sidebar
     * if it is using this plugin.
     *
     * @private
     */
    _setupListeners() {
        if (!this.name) {
            throw new Error('SidebarModule subclasses must have a name');
        }

        // TODO: Stop using Meteor's reactivity here
        Tracker.autorun((computation) => {
            const plugin = Session.get('SidebarModuleChanged');
            if (this.name !== plugin) {
                return;
            }

            console.warn(`SidebarChanged to ${this.name}`);

            // Bail out if this is the first time the autorun
            // executes (i.e. when it is being defined).
            //
            // Note: This has to be checked after the dependency on the
            // Session variable above, or the reactive dependency will not
            // be established.
            if (computation.firstRun === true) {
                return;
            }

            // In case we need to disable the use
            // of this plugin, we can also stop the
            // reactive computation by setting
            // this.destroyed to true.
            if (this._destroyed === true) {
                computation.stop();
            }

            // Identify all viewports which should be
            // rendered by the ViewportPlugin, and render
            // them.
            const div = SidebarModule._getParentDiv();
            this.setup(div);
        });
    }

    /**
     * Retrieve the Sidebar div
     *
     * @private
     */
    static _getParentDiv() {
       return document.getElementById('sidebar');
    }

    /**
     * Stop listening for changes to the viewport layout in order to
     * automatically rerender viewports setup for use by this plugin.
     */
    stopListeners() {
        this._destroyed = true;
    }
}
