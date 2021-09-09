import * as RDF from "@rdfjs/types";
import { DataFactory } from 'rdf-data-factory';

export interface IMaterializeOptions {
    versionOfProperty: RDF.NamedNode;
    timestampProperty: RDF.NamedNode;
}

export const materialize = (quads: Array<RDF.Quad>, options: IMaterializeOptions): Array<RDF.Quad> => {
    const objectIdMap: Map<string, RDF.NamedNode> = new Map();
    const factory: RDF.DataFactory = new DataFactory();

    for (let quad of quads) {
        if (quad.predicate.equals(options.versionOfProperty)) {
            objectIdMap.set(quad.subject.value, factory.namedNode(quad.object.value));
        }
    }

    if(objectIdMap.size > 0){
        const result: RDF.Quad[] = [];

        for(let quad of quads){
            if(quad.predicate.equals(options.versionOfProperty)){
                result.push(factory.quad(
                    objectIdMap.get(quad.subject.value)!,
                    factory.namedNode('http://purl.org/dc/terms/hasVersion'),
                    factory.namedNode(quad.subject.value),
                    quad.graph
                ));
                continue;
            }

            if(quad.predicate.equals(options.timestampProperty)){
                result.push(factory.quad(
                    objectIdMap.get(quad.subject.value)!,
                    factory.namedNode('http://purl.org/dc/terms/modified'),
                    quad.object,
                    quad.graph
                ));
                continue;
            }

            if (objectIdMap.has(quad.object.value) && quad.subject.value !== quad.object.value) {
                result.push(factory.quad(
                    objectIdMap.get(quad.subject.value)!,
                    quad.predicate,
                    objectIdMap.get(quad.object.value)!,
                    quad.graph
                ));
                continue;
            }
            
            result.push(factory.quad(
                objectIdMap.get(quad.subject.value)!,
                quad.predicate,
                quad.object,
                quad.graph
            ))
        }
        return result;
    } else {
        return quads;
    }
}
