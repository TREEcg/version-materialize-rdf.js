# version-materialize-rdf.js
JS library to version materialize a set of triples

## What is a version materialization?

An example:
```turtle
:Av1 dcterms:isVersionOf :A ;
     dcterms:created "2021-10-05T11:00:00Z" ;
     ex:linkToOtherObject :Bv1 ;
     rdfs:label "A v0.0.1".
:Bv1 dcterms:isVersionOf :B ;
     rdfs:label "B v0.0.1" ;
     dcterms:created "2021-05-05T11:00:00Z" .
``` 

Should be translated to:
```turtle
:A rdfs:label "A v0.0.1" ;
   dcterms:hasVersion :Av1 ;
   ex:linkToOtherObject :B .

:Av1 dcterms:created "2021-10-05T11:00:00Z" .

:B  dcterms:hasVersion :Bv1 ;
    rdfs:label "Bv0.0.1" .

:Bv1 dcterms:created "2021-05-05T11:00:00Z" .

   
```

## Use it

```bash
npm install @treecg/version-materialize-rdf.js
```

We expect an `Array<Quad>` or an `AsyncIterator<Quad>` at the input, with a targetNode.

```javascript
import { DataFactory } from 'rdf-data-factory';
import { materialize } from 'version-materialize-rdf.js';
import * as RDF from 'rdf-js';

const factory: RDF.DataFactory = new DataFactory();
let options = {
    "versionOfProperty": factory.namedNode('http://purl.org/dc/terms/isVersionOf'), // defaults to dcterms:isVersionOf
    "timestampProperty" : factory.namedNode('http://purl.org/dc/terms/created'), // defaults to dcterms:created, but there may be good reasons to change this to e.g., prov:generatedAtTime
    "addRdfStreamProcessingTriple": true
};
console.log(materialize(quads, options));
```

## What it does

In the original data we’ll have a triple that looks like this:
```turtle
<versionId> <versionOfProperty> <objectId> .
```

 * It searches for a namenode and literal of the configurable versionOf and timestamp properties in iterations
 * It swaps all instances of versionId with the objectId
 * It changes`dcterms:hasVersionOf` with `dcterms:hasVersion`
 * It keeps the timestamp predicate and literal on the object of the `dcterms:hasVersion` object
 * It puts everything in a graph called `<versionId>`
 * A triple is added stating that the graph `<versionId>` was `prov:generatedAtTime` the timestamp
