import * as RDF from "@rdfjs/types";
import { DataFactory } from 'rdf-data-factory';

export interface IMaterializeOptions {
    versionOfProperty: RDF.NamedNode;
    timestampProperty: RDF.NamedNode;
    addRdfStreamProcessingTriple?: boolean;
}

export const materialize = (quads: Array<RDF.Quad>, options: IMaterializeOptions): Array<RDF.Quad> => {
    const objectIdMap: Map<string, RDF.NamedNode> = new Map();
    const versionTimestampMap: Map<string, string> = new Map();
    const factory: RDF.DataFactory = new DataFactory();

    for (let quad of quads) {
        if (quad.predicate.equals(options.versionOfProperty)) {
            objectIdMap.set(quad.subject.value, factory.namedNode(quad.object.value));
        }

        if (quad.predicate.equals(options.timestampProperty)) {
            versionTimestampMap.set(quad.subject.value, quad.object.value);
        }
    }

    if (objectIdMap.size > 0) {
        const result: RDF.Quad[] = [];

        for (let quad of quads) {
            if (quad.predicate.equals(options.versionOfProperty)) {
                result.push(factory.quad(
                    objectIdMap.get(quad.subject.value)!,
                    factory.namedNode('http://purl.org/dc/terms/hasVersion'),
                    factory.namedNode(quad.subject.value),
                    factory.namedNode(quad.subject.value)
                ));
                continue;
            }

            if (quad.predicate.equals(options.timestampProperty)) {
                result.push(factory.quad(
                    quad.subject,
                    quad.predicate,
                    quad.object,
                    factory.namedNode(quad.subject.value)
                ));
                continue;
            }

            // If triple contains links to other object
            if (objectIdMap.has(quad.object.value) && quad.subject.value !== quad.object.value) {
                result.push(factory.quad(
                    objectIdMap.get(quad.subject.value)!,
                    quad.predicate,
                    objectIdMap.get(quad.object.value)!,
                    factory.namedNode(quad.subject.value)
                ));
                continue;
            }

            result.push(factory.quad(
                objectIdMap.get(quad.subject.value)!,
                quad.predicate,
                quad.object,
                factory.namedNode(quad.subject.value)
            ));
        }

        if (options.addRdfStreamProcessingTriple) {
            versionTimestampMap.forEach((value, key) => {
                result.push(factory.quad(
                    factory.namedNode(key),
                    factory.namedNode('http://www.w3.org/ns/prov#generatedAtTime'),
                    factory.literal(value, factory.namedNode('http://www.w3.org/2001/XMLSchema#dateTime'))
                ))
            });
        }
        return result;
    } else {
        return quads;
    }
}
