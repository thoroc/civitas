import SnapshotExplorer from './SnapshotExplorer';

// Server component wrapper; SnapshotExplorer is client-side.
// Optional: could pass an initialDate param via search params in future.

const ParliamentPage = () => {
  return <SnapshotExplorer />;
};

export default ParliamentPage;
