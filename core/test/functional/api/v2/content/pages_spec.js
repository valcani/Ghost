const url = require('url');
const should = require('should');
const supertest = require('supertest');
const testUtils = require('../../../../utils');
const localUtils = require('./utils');
const configUtils = require('../../../../utils/configUtils');
const config = require('../../../../../../core/server/config');

const ghost = testUtils.startGhost;
let request;

describe('Pages', function () {
    before(function () {
        return ghost()
            .then(function () {
                request = supertest.agent(config.get('url'));
            })
            .then(function () {
                return testUtils.initFixtures('users:no-owner', 'user:inactive', 'posts', 'tags:extra', 'client:trusted-domain');
            });
    });

    afterEach(function () {
        configUtils.restore();
    });

    it('browse pages', function () {
        request.get(localUtils.API.getApiQuery('pages/?client_id=ghost-admin&client_secret=not_available'))
            .set('Origin', testUtils.API.getURL())
            .expect('Content-Type', /json/)
            .expect('Cache-Control', testUtils.cacheRules.private)
            .expect(200)
            .then((res) => {
                res.headers.vary.should.eql('Origin, Accept-Encoding');
                should.exist(res.headers['access-control-allow-origin']);
                should.not.exist(res.headers['x-cache-invalidate']);

                const jsonResponse = res.body;
                should.exist(jsonResponse.pages);
                should.exist(jsonResponse.meta);
                jsonResponse.pages.should.have.length(1);

                res.body.pages[0].slug.should.eql(testUtils.DataGenerator.Content.posts[5].slug);

                const urlParts = url.parse(res.body.pages[0].url);
                should.exist(urlParts.protocol);
                should.exist(urlParts.host);
            });
    });
});
