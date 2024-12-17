"""
Diese Datei enthält Funktionen zur Durchführung von Clustering-Operationen auf Dokument- und Ordner-Embeddings.
Sie ermöglicht das Laden von Embeddings, die Berechnung von Distanzen und die Ausführung des HDBSCAN-Clustering-Algorithmus.
Zusätzlich werden semantische Ähnlichkeiten zwischen Ordnern berücksichtigt.

@author Lennart, Miray. 
Die Funktionen wurden mit Unterstützung von KI erstellt
"""

import hdbscan
import numpy as np
import json
import sys
import traceback
from sklearn.preprocessing import normalize
from scipy.spatial.distance import cdist

class GuidedClustering:
    def __init__(self, folder_weight=0.45, semantic_similarity_threshold=0.7):
        self.folder_weight = folder_weight
        self.semantic_similarity_threshold = semantic_similarity_threshold
        self.folder_affinities = {}  # Store document-folder affinities
    
    def prepare_data(self, doc_embeddings, folder_embeddings=None, doc_to_folder_map=None):
        """
        Enhanced data preparation with folder affinity computation
        """
        # Convert to numpy arrays and normalize
        self.doc_embeddings = np.array(doc_embeddings)
        self.doc_embeddings = normalize(self.doc_embeddings)
        
        # Store folder information if provided
        self.has_folder_guidance = folder_embeddings is not None and doc_to_folder_map is not None
        if self.has_folder_guidance:
            self.folder_ids = list(folder_embeddings.keys())
            self.folder_matrix = np.array(list(folder_embeddings.values()))
            self.folder_matrix = normalize(self.folder_matrix)
            self.doc_to_folder = doc_to_folder_map
            
            # Compute and store folder affinities for each document
            folder_similarities = 1 - cdist(self.doc_embeddings, self.folder_matrix, metric='cosine')
            for i, similarities in enumerate(folder_similarities):
                significant_affinities = {}
                for j, sim in enumerate(similarities):
                    if sim >= self.semantic_similarity_threshold:
                        significant_affinities[self.folder_ids[j]] = float(sim)
                if significant_affinities:
                    self.folder_affinities[str(i)] = significant_affinities
            
            # Compute semantic similarities between folders
            folder_distances = cdist(self.folder_matrix, self.folder_matrix, metric='cosine')
            self.folder_similarities = 1 - folder_distances
    
    def compute_distances(self):
        """
        Enhanced distance computation with semantic context
        """
        # Base distances between documents
        distances = cdist(self.doc_embeddings, self.doc_embeddings, metric='cosine')
        
        if not self.has_folder_guidance:
            return distances
            
        # Create enhanced feature space
        folder_similarities = 1 - cdist(self.doc_embeddings, self.folder_matrix, metric='cosine')
        enhanced_features = np.hstack([
            self.doc_embeddings * (1 - self.folder_weight),
            folder_similarities * self.folder_weight
        ])
        enhanced_features = normalize(enhanced_features)
        
        # Compute final distances in enhanced space
        final_distances = cdist(enhanced_features, enhanced_features, metric='cosine')
        
        return final_distances
    def __init__(self, folder_weight=0.3, semantic_similarity_threshold=0.8):
        self.folder_weight = folder_weight
        self.semantic_similarity_threshold = semantic_similarity_threshold
    
    def prepare_data(self, doc_embeddings, folder_embeddings=None, doc_to_folder_map=None):
        """
        Prepare embeddings and create weighted distance matrix.
        Falls back to regular clustering if folder data is not provided.
        """
        # Convert to numpy arrays and normalize
        self.doc_embeddings = np.array(doc_embeddings)
        self.doc_embeddings = normalize(self.doc_embeddings)
        
        # Store folder information if provided
        self.has_folder_guidance = folder_embeddings is not None and doc_to_folder_map is not None
        if self.has_folder_guidance:
            self.folder_ids = list(folder_embeddings.keys())
            self.folder_matrix = np.array(list(folder_embeddings.values()))
            self.folder_matrix = normalize(self.folder_matrix)
            self.doc_to_folder = doc_to_folder_map
            
            # Compute semantic similarities between folders
            folder_distances = cdist(self.folder_matrix, self.folder_matrix, metric='cosine')
            # Convert distances to similarities (1 - distance)
            self.folder_similarities = 1 - folder_distances
            print(f"[DEBUG] Folder similarities matrix shape: {self.folder_similarities.shape}", file=sys.stderr)
            
            # Create a matrix of similar folder pairs
            self.similar_folders = self.folder_similarities >= self.semantic_similarity_threshold
            
            # Log folder similarity information
            for i in range(len(self.folder_ids)):
                for j in range(i + 1, len(self.folder_ids)):
                    similarity = self.folder_similarities[i, j]
                    print(f"[DEBUG] Folder similarity between '{self.folder_ids[i]}' and '{self.folder_ids[j]}': {similarity:.3f}", 
                          file=sys.stderr)
    
    def get_folder_similarity(self, folder_id1, folder_id2):
        """Get semantic similarity between two folders."""
        if folder_id1 == folder_id2:
            return 1.0
            
        try:
            idx1 = self.folder_ids.index(folder_id1)
            idx2 = self.folder_ids.index(folder_id2)
            return self.folder_similarities[idx1, idx2]
        except (ValueError, IndexError):
            return 0.0
    
    def compute_distances(self):
        """
        Compute distance matrix with optional folder guidance and semantic similarity
        """
        # Base distances between documents
        distances = cdist(self.doc_embeddings, self.doc_embeddings, metric='cosine')
        
        if not self.has_folder_guidance:
            return distances
            
        # Adjust distances based on folder membership and semantic similarity
        for i in range(len(self.doc_embeddings)):
            for j in range(i + 1, len(self.doc_embeddings)):
                folder_i = self.doc_to_folder.get(str(i))
                folder_j = self.doc_to_folder.get(str(j))
                
                if folder_i is not None and folder_j is not None:
                    # Get semantic similarity between folders
                    folder_similarity = self.get_folder_similarity(folder_i, folder_j)
                    
                    if folder_similarity >= self.semantic_similarity_threshold:
                        # Documents in semantically similar folders - reduce distance
                        reduction_factor = self.folder_weight * folder_similarity
                        distances[i, j] *= (1 - reduction_factor)
                        distances[j, i] = distances[i, j]
                    else:
                        # Documents in different, dissimilar folders - slightly increase distance
                        increase_factor = self.folder_weight * (1 - folder_similarity) * 0.5
                        distances[i, j] *= (1 + increase_factor)
                        distances[j, i] = distances[i, j]
                    
        return distances

def main():
    try:
        # Load embeddings and config
        with open(sys.argv[1], 'r') as f:
            embeddings_data = json.load(f)
        
        with open(sys.argv[2], 'r') as f:
            config = json.load(f)

        # Handle both document embeddings and folder data
        doc_embeddings = np.array(embeddings_data.get('doc_embeddings', []))
        folder_embeddings = embeddings_data.get('folder_embeddings', {})
        doc_to_folder_map = embeddings_data.get('doc_to_folder_map', {})
        
        # Normalize document embeddings
        normalized_docs = normalize(doc_embeddings)
        
        # Process folder data if available
        if folder_embeddings:
            # Convert folder embeddings to matrix
            folder_matrix = np.array(list(folder_embeddings.values()))
            folder_matrix = normalize(folder_matrix)
            
            # Compute folder-document similarities
            folder_similarities = 1 - cdist(normalized_docs, folder_matrix, metric='cosine')
            
            # Compute semantic context
            anchor_influence = config.get('anchorInfluence', 0.45)
            semantic_threshold = config.get('semanticThreshold', 0.7)
            
            # Enhanced feature space combining document and folder information
            transformed_embeddings = np.hstack([
                normalized_docs * (1 - anchor_influence),
                folder_similarities * anchor_influence
            ])
            
            # Apply additional weighting for documents with known folders
            folder_ids = list(folder_embeddings.keys())
            for doc_idx, folder_id in doc_to_folder_map.items():
                doc_idx = int(doc_idx)
                if doc_idx < len(transformed_embeddings):
                    folder_idx = folder_ids.index(folder_id)
                    folder_vec = folder_similarities[doc_idx]
                    
                    # Create boost vector based on folder similarity
                    boost = np.zeros_like(folder_vec)
                    boost[folder_idx] = 1.0
                    
                    # Find and boost similar folders
                    for other_idx, sim in enumerate(folder_vec):
                        if sim >= semantic_threshold and other_idx != folder_idx:
                            boost[other_idx] = sim
                    
                    # Apply boost to folder context
                    transformed_embeddings[doc_idx, -len(folder_vec):] *= (1 + boost * 0.5)
            
            # Normalize final embeddings
            transformed_embeddings = normalize(transformed_embeddings)
            
            # Compute folder affinities for future suggestions
            folder_affinities = {}
            for i, similarities in enumerate(folder_similarities):
                significant_folders = {}
                for j, sim in enumerate(similarities):
                    if sim >= semantic_threshold:
                        significant_folders[folder_ids[j]] = float(sim)
                if significant_folders:
                    folder_affinities[str(i)] = significant_folders
            
        else:
            transformed_embeddings = normalized_docs
            folder_affinities = {}

        # Initialize HDBSCAN clusterer
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=config.get('minClusterSize', 2),
            min_samples=config.get('minSamples', 2),
            cluster_selection_method=config.get('clusterSelectionMethod', 'eom'),
            cluster_selection_epsilon=config.get('clusterSelectionEpsilon', 0.15),
            metric='euclidean',
            core_dist_n_jobs=-1
        )

        # Perform clustering
        labels = clusterer.fit_predict(transformed_embeddings)
        
        # Calculate cluster statistics
        num_clusters = len(set(labels[labels != -1]))
        noise_points = sum(labels == -1)
        
        # Log clustering information
        print(f"[INFO] Documents processed: {len(doc_embeddings)}", file=sys.stderr)
        print(f"[INFO] Clusters found: {num_clusters}", file=sys.stderr)
        print(f"[INFO] Noise points: {noise_points}", file=sys.stderr)
        
        if folder_embeddings:
            print(f"[INFO] Folders used for guidance: {len(folder_embeddings)}", file=sys.stderr)
            
            # Debug folder similarities
            folder_docs = {str(i): list(affs.items()) 
                         for i, affs in folder_affinities.items() 
                         if len(affs) > 0}
            print(f"[DEBUG] Max similarity score: {folder_similarities.max():.3f}", file=sys.stderr)
            print(f"[DEBUG] Mean similarity score: {folder_similarities.mean():.3f}", file=sys.stderr)
            print(f"[DEBUG] Documents with strong folder affinities: {len(folder_docs)}", 
                  file=sys.stderr)

        # Prepare output with clusterer probabilities
        result = {
            'labels': labels.tolist(),
            'probabilities': clusterer.probabilities_.tolist(),
            'folder_context': {
                'affinities': folder_affinities,
                'statistics': {
                    'documents_with_affinities': len(folder_affinities),
                    'average_affinities_per_doc': 
                        sum(len(v) for v in folder_affinities.values()) / 
                        len(folder_affinities) if folder_affinities else 0
                }
            },
            'clustering_stats': {
                'num_clusters': int(num_clusters),
                'noise_points': int(noise_points),
                'cluster_sizes': [(int(label), int(sum(labels == label))) 
                                for label in set(labels) if label != -1]
            }
        }
        
        # Output final result
        print(json.dumps(result))
        
    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr)
        print(f"[TRACEBACK] {traceback.format_exc()}", file=sys.stderr)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()