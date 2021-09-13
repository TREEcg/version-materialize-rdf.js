#!/usr/bin/env node

import { newEngine } from '@treecg/actor-init-ldes-client';
import { IMaterializeOptions, materialize } from '../lib/materialize';
import { DataFactory } from 'rdf-data-factory';
import * as RDF from 'rdf-js';
import { program } from 'commander';

program
  .requiredOption('--url <url>', 'The URL of the Linked Data Event Stream')
  .parse();

const options = program.opts();
const url = options.url;

const run = async (_url: string) => {
  const ldesOptions = {
    "pollingInterval": 5000,
    "representation": "Quads",
    "emitMemberOnce": true,
    "disablePolling": true,
  };

  const factory: RDF.DataFactory = new DataFactory();
  const materializeOptions: IMaterializeOptions = {
    "versionOfProperty": factory.namedNode('http://purl.org/dc/terms/isVersionOf'), // defaults to dcterms:isVersionOf
    "timestampProperty": factory.namedNode('http://purl.org/dc/terms/created'), // defaults to dcterms:created, but there may be good reasons to change this to e.g., prov:generatedAtTime
    "addRdfStreamProcessingTriple": true
  };

  let LDESClient = newEngine();
  let ldes = LDESClient.createReadStream(url, ldesOptions);

  ldes.on('data', (member) => {
    console.log(materialize(member.quads, materializeOptions));
  });
};

run(url).catch(error => console.log(error));