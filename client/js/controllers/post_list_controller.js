'use strict';

const router = require('../router.js');
const api = require('../api.js');
const settings = require('../models/settings.js');
const uri = require('../util/uri.js');
const PostList = require('../models/post_list.js');
const topNavigation = require('../models/top_navigation.js');
const PageController = require('../controllers/page_controller.js');
const PostsHeaderView = require('../views/posts_header_view.js');
const PostsPageView = require('../views/posts_page_view.js');
const EmptyView = require('../views/empty_view.js');

const fields = [
    'id', 'thumbnailUrl', 'type', 'safety',
    'score', 'favoriteCount', 'commentCount', 'tags', 'version'];

class PostListController {
    constructor(ctx) {
        if (!api.hasPrivilege('posts:list')) {
            this._view = new EmptyView();
            this._view.showError('You don\'t have privileges to view posts.');
            return;
        }

        topNavigation.activate('posts');
        topNavigation.setTitle('Listing posts');

        this._ctx = ctx;
        this._pageController = new PageController();

        this._headerView = new PostsHeaderView({
            hostNode: this._pageController.view.pageHeaderHolderNode,
            parameters: ctx.parameters,
            enableSafety: api.safetyEnabled(),
            canBulkEditTags: api.hasPrivilege('posts:bulk-edit:tags'),
            canBulkEditSafety: api.hasPrivilege('posts:bulk-edit:safety'),
            bulkEdit: {
                tags: this._bulkEditTags
            },
        });
        this._headerView.addEventListener(
            'navigate', e => this._evtNavigate(e));

        this._syncPageController();
    }

    showSuccess(message) {
        this._pageController.showSuccess(message);
    }

    get _bulkEditTags() {
        return (this._ctx.parameters.tag || '').split(/\s+/).filter(s => s);
    }

    _evtNavigate(e) {
        router.showNoDispatch(
            uri.formatClientLink('posts', e.detail.parameters));
        Object.assign(this._ctx.parameters, e.detail.parameters);
        this._syncPageController();
    }

    _evtTag(e) {
        Promise.all(
            this._bulkEditTags.map(tag =>
                e.detail.post.tags.addByName(tag)))
            .then(e.detail.post.save())
            .catch(error => window.alert(error.message));
    }

    _evtUntag(e) {
        for (let tag of this._bulkEditTags) {
            e.detail.post.tags.removeByName(tag);
        }
        e.detail.post.save().catch(error => window.alert(error.message));
    }

    _evtChangeSafety(e) {
        e.detail.post.safety = e.detail.safety;
        e.detail.post.save().catch(error => window.alert(error.message));
    }

    _syncPageController() {
        this._pageController.run({
            parameters: this._ctx.parameters,
            defaultLimit: parseInt(settings.get().postsPerPage),
            getClientUrlForPage: (offset, limit) => {
                const parameters = Object.assign(
                    {}, this._ctx.parameters, {offset: offset, limit: limit});
                return uri.formatClientLink('posts', parameters);
            },
            requestPage: (offset, limit) => {
                return PostList.search(
                    this._ctx.parameters.query, offset, limit, fields);
            },
            pageRenderer: pageCtx => {
                Object.assign(pageCtx, {
                    canViewPosts: api.hasPrivilege('posts:view'),
                    canBulkEditTags: api.hasPrivilege('posts:bulk-edit:tags'),
                    canBulkEditSafety:
                        api.hasPrivilege('posts:bulk-edit:safety'),
                    bulkEdit: {
                        tags: this._bulkEditTags,
                    },
                });
                const view = new PostsPageView(pageCtx);
                view.addEventListener('tag', e => this._evtTag(e));
                view.addEventListener('untag', e => this._evtUntag(e));
                view.addEventListener(
                    'changeSafety', e => this._evtChangeSafety(e));
                return view;
            },
        });
    }
}

module.exports = router => {
    router.enter(
        ['posts'],
        (ctx, next) => { ctx.controller = new PostListController(ctx); });
};
