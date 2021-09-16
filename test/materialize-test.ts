import { IMaterializeOptions, materialize } from '../lib/materialize';
import type * as RDF from 'rdf-js';
import { DataFactory } from 'rdf-data-factory';

describe('LDES version materialization library', () => {
  let quads: RDF.Quad[];
  let factory: DataFactory;
  let options: IMaterializeOptions;
  let objectIds: string[];
  let versionIds: string[];

  beforeAll(() => {
    factory = new DataFactory();
    options = {
      "versionOfProperty": factory.namedNode('http://purl.org/dc/terms/isVersionOf'),
      "timestampProperty": factory.namedNode('http://purl.org/dc/terms/created'),
      "addRdfStreamProcessingTriple": false
    };
  });

  beforeEach(() => {
    quads = [
      factory.quad(
        factory.namedNode('http://marineregions.org/mrgid/58739?t=1631005686'),
        factory.namedNode('http://purl.org/dc/terms/isVersionOf'),
        factory.namedNode('http://marineregions.org/mrgid/58739')
      ),
      factory.quad(
        factory.namedNode('http://marineregions.org/mrgid/58739?t=1631005686'),
        factory.namedNode('http://purl.org/dc/terms/created'),
        factory.literal('2021-09-07T09:08:06Z', factory.namedNode('http://www.w3.org/2001/XMLSchema#dateTime'))
      ),
      factory.quad(
        factory.namedNode('http://marineregions.org/mrgid/35127?t=1631005686'),
        factory.namedNode('http://purl.org/dc/terms/isVersionOf'),
        factory.namedNode('http://marineregions.org/mrgid/35127')
      ),
      factory.quad(
        factory.namedNode('http://marineregions.org/mrgid/35127?t=1631005686'),
        factory.namedNode('http://purl.org/dc/terms/created'),
        factory.literal('2021-09-07T09:08:06Z', factory.namedNode('http://www.w3.org/2001/XMLSchema#dateTime'))
      ),
      factory.quad(
        factory.namedNode('http://marineregions.org/mrgid/35127?t=1631005686'),
        factory.namedNode('http://www.w3.org/2000/01/rdf-schema#'),
        factory.literal('Label for version', factory.namedNode('http://www.w3.org/2001/XMLSchema#string'))
      )
    ];
  })

  test('Materialize should be a function', () => {
    expect(materialize).toBeInstanceOf(Function);
  });

  test('Materialize should return an Array of RDF Quads', () => {
    const modifiedQuads = materialize(quads, options);
    expect(modifiedQuads).toBeInstanceOf(Array);
  });

  describe('Materialize version property triple', () => {
    test('it should change predicate from dcterms:isVersionOf to dcterms:hasVersion', () => {
      const versionPropertyTriple = quads[0];
      const modifiedQuads: RDF.Quad[] = materialize([versionPropertyTriple], options);
      expect(modifiedQuads[0].predicate.equals(factory.namedNode('http://purl.org/dc/terms/hasVersion')));
    });

    test('it should swap subject and object for version property triple', () => {
      const versionPropertyTriple = quads[0];
      const modifiedQuads: RDF.Quad[] = materialize([versionPropertyTriple], options);
      expect(versionPropertyTriple.subject).toEqual(modifiedQuads[0].object);
      expect(versionPropertyTriple.object).toEqual(modifiedQuads[0].subject);
    });
  });

  describe('Materialize timestamp property triple', () => {
    test('it should swap version ids for object ids except for version property triple', () => {
      const versionIds: string[] = [];
      const objectIds: string[] = [];
      quads.forEach(quad => {
        if (quad.predicate.equals(options.versionOfProperty)) {
          versionIds.push(quad.subject.value,);
          objectIds.push(quad.object.value);
        }
      });

      const modifiedQuads = materialize(quads, options);
      modifiedQuads.forEach(quad => {
        if (quad.predicate.equals(options.timestampProperty)) {
          expect(versionIds).toContain(quad.subject.value);
        } else {
          expect(objectIds).toContain(quad.subject.value);
        }
      });
    });

    describe('RDF Stream Processing options', () => {
      test('it should add extra triples if the option is set', () => {
        const versionIds: string[] = [];
        quads.forEach(quad => {
          if (quad.predicate.equals(options.versionOfProperty)) {
            versionIds.push(quad.subject.value);
          }
        });
        console.log(versionIds);

        options.addRdfStreamProcessingTriple = true;

        const modifiedQuads = materialize(quads, options);
        let defaultGraphCounter = 0;

        modifiedQuads.forEach(quad => {
          // Default Graph
          if (!quad.graph.value) {
            defaultGraphCounter++;
            expect(versionIds).toContain(quad.subject.value);
            expect(quad.predicate.value).toBe('http://www.w3.org/ns/prov#generatedAtTime')
          }
        });

        expect(defaultGraphCounter).toEqual(versionIds.length);
      });
    });
  });

  test('it should replace other version ids if their object id is known', () => {
    quads.push(factory.quad(
      factory.namedNode('http://marineregions.org/mrgid/58739?t=1631005686'),
      factory.namedNode('http://example.org/linkToOtherObject'),
      factory.namedNode('http://marineregions.org/mrgid/35127?t=1631005686')
    ));

    const modifiedQuads = materialize(quads, options);

    modifiedQuads.forEach(quad => {
      if (quad.predicate.equals(factory.namedNode('http//example.org/linkToOtherObject'))) {
        expect(quad.object.value).toEqual('http://marineregions.org/mrgid/35127');
      }
    });
  });

  test('it should return the original quads if no versioning was applied', () => {
    const regularQuad = factory.quad(
      factory.namedNode('http://marineregions.org/mrgid/58739?t=1631005686'),
      factory.namedNode('http://example.org/name'),
      factory.literal('Regular quad')
    );

    const modifiedQuads = materialize([regularQuad], options);

    expect(modifiedQuads[0]).toEqual(regularQuad);
  });
});