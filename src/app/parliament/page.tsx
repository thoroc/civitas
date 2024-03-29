import Barchart from '../components/d3/Barchart';
import Linechart from '../components/d3/linechart';

const Foo = () => {
  return (
    <div>
      <h1>Hemicycle Visualisation</h1>
      <div>
        <h2>Examples</h2>
        <ul>
          <li>
            https://observablehq.com/@piecesofuk/uk-parliament-party-totals
          </li>
        </ul>
      </div>
      <Barchart />
      <Linechart />
    </div>
  );
};

export default Foo;
