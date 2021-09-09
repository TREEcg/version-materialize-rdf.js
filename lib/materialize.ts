import * as RDF from "@rdfjs/types";
import { DataFactory, Quad } from 'rdf-data-factory';


export default class {
    public static materialize (quads: Array<RDF.Quad>, options: any): Array<RDF.Quad> {
        let factory = new DataFactory();
        //First, find the is version of object
        let versionOf : RDF.NamedNode;
        if (options.versionOfProperty)
            versionOf = options.versionOfProperty;
        else 
            versionOf = factory.namedNode('http://purl.org/dc/terms/isVersionOf');

        let objectIdMap: Map<string, RDF.Term>;
        for (let quad of quads) {
            if (quad.predicate.equals(versionOf)) {
                objectIdMap[quad.subject.value] = quad.object;
            }
        }
        if (objectIdMap.size > 0) {
            //Now loop again through the quads and create a new Quad object
            let result : Array<RDF.Quad> = [];
            for (let quad of quads) {
                result.push (TODO));
            }

        } else {
            //No materialization possible, just return the existing triples
            return quads;
        }
    }

}