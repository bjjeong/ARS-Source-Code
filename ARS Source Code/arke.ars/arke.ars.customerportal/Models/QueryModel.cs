namespace Arke.ARS.CustomerPortal.Models
{
    public sealed class QueryModel
    {
        public QueryModel ()
        {
            PageIndex = 1;
            SortColumn = "Title";
            SortOrder = true;
        }

        public string SortColumn { get; set; }

        public bool? SortOrder { get; set; }

        public int PageIndex { get; set; }
    }
}