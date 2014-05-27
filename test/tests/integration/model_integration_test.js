import Orbit from 'orbit';
import attr from 'ember_orbit/attr';
import hasOne from 'ember_orbit/relationships/has_one';
import hasMany from 'ember_orbit/relationships/has_many';
import Context from 'ember_orbit/context';
import Store from 'ember_orbit/store';
import Model from 'ember_orbit/model';
import { createStore } from 'test_helper';

var get = Ember.get;
var Planet,
    Moon,
    Star,
    store,
    context;

module("Integration - Model", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet')
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet')
    });

    Planet = Model.extend({
      name: attr('string'),
      classification: attr('string'),
      sun: hasOne('star'),
      moons: hasMany('moon')
    });

    store = createStore({
      models: {
        star: Star,
        moon: Moon,
        planet: Planet
      }
    });

    context = Context.create({
      store: store
    });
  },

  teardown: function() {
    Orbit.Promise = null;
    Star = null;
    Moon = null;
    Planet = null;
    store = null;
    context = null;
  }
});

test("store exists", function() {
  ok(store);
});

test("store is properly linked to models", function() {
  equal(store.modelFor('star'), Star);
  equal(store.modelFor('planet'), Planet);
  equal(store.modelFor('moon'), Moon);
});

test("new models can be created and updated", function() {
  expect(4);

  Ember.run(function() {
    stop();
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(planet.get('name'), 'Earth');

      planet.set('name', 'Jupiter');

      equal(planet.get('name'), 'Jupiter', 'CP reflects transformed value');

      equal(context._source.retrieve(['planet', planet.get('clientid'), 'name']),
            'Earth',
            'memory source patch is not yet complete');

      context.then(function() {
        start();
        equal(context._source.retrieve(['planet', planet.get('clientid'), 'name']),
              'Jupiter',
              'memory source patch is now complete');
      });
    });
  });
});

test("model properties can be reset through transforms", function() {
  expect(3);

  Ember.run(function() {
    stop();
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(planet.get('name'), 'Earth');

      context.transform({
        op: 'replace',
        path: ['planet', planet.get('clientid'), 'name'],
        value: 'Jupiter'
      });

      equal(planet.get('name'), 'Earth', 'CP has not been invalidated yet');

      context.then(function() {
        start();
        equal(planet.get('name'), 'Jupiter', 'CP reflects transformed value');
      });
    });
  });
});